import type { Handler } from '@netlify/functions';
import { Query } from 'node-appwrite';
import {
  getAuthBearerToken,
  verifyAdminSession,
  jsonResponse,
} from './_adminAuth';
import { getAppwriteServer } from './_appwriteServer';

export const handler: Handler = async (event) => {
  const token = getAuthBearerToken(event.headers ?? {});
  const auth = await verifyAdminSession(token);
  if (!auth.authorized) {
    return jsonResponse(401, { error: auth.error ?? 'Unauthorized' });
  }

  const aw = getAppwriteServer();
  if (!aw) {
    return jsonResponse(500, { error: 'Server configuration error' });
  }

  const { databases, databaseId, collections } = aw;

  if (event.httpMethod === 'GET') {
    try {
      const { documents: disputes } = await databases.listDocuments({
        databaseId,
        collectionId: collections.disputes,
        queries: [
          Query.or([Query.equal('status', 'pending'), Query.equal('status', 'under_review')]),
          Query.orderDesc('$createdAt'),
          Query.limit(500),
        ],
      });

      const list = disputes ?? [];
      const recordIds = [...new Set(list.map((d) => (d as { record_id?: string }).record_id).filter(Boolean))] as string[];
      let recordToPerson: Record<string, string> = {};
      if (recordIds.length > 0) {
        for (const rid of recordIds) {
          try {
            const rec = await databases.getDocument(databaseId, collections.records, rid);
            const personId = (rec as { person_id?: string }).person_id;
            if (personId) {
              const person = await databases.getDocument(databaseId, collections.persons, personId);
              recordToPerson[rid] = String((person as { full_name?: string }).full_name ?? '—');
            } else {
              recordToPerson[rid] = '—';
            }
          } catch {
            recordToPerson[rid] = '—';
          }
        }
      }

      const disputesWithSubject = list.map((d) => {
        const claim = String((d as { claim?: string }).claim ?? '');
        const record_id = String((d as { record_id?: string }).record_id ?? '');
        return {
          id: d.$id,
          record_id,
          subject_name: recordToPerson[record_id] ?? '—',
          claim_preview: claim.split('\n')[0]?.replace(/^Nature:\s*/i, '').slice(0, 60) ?? '',
          created_at: d.$createdAt,
          evidence_url: (d as { evidence_url?: string | null }).evidence_url ?? null,
          status: (d as { status?: string }).status,
        };
      });

      return jsonResponse(200, { disputes: disputesWithSubject });
    } catch (e) {
      console.error('admin-disputes GET', e);
      return jsonResponse(500, { error: 'Failed to list disputes' });
    }
  }

  if (event.httpMethod === 'POST') {
    let body: { dispute_id?: string; action?: string };
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const disputeId = body.dispute_id?.trim();
    const action = body.action;
    if (!disputeId || !action) {
      return jsonResponse(400, { error: 'dispute_id and action are required' });
    }

    const validActions = ['under_review', 'resolved_removed', 'resolved_retained'];
    if (!validActions.includes(action)) {
      return jsonResponse(400, { error: 'Invalid action' });
    }

    let dispute: { record_id?: string };
    try {
      dispute = (await databases.getDocument(
        databaseId,
        collections.disputes,
        disputeId,
      )) as { record_id?: string };
    } catch {
      return jsonResponse(404, { error: 'Dispute not found' });
    }

    const reviewedAt = new Date().toISOString();

    try {
      await databases.updateDocument({
        databaseId,
        collectionId: collections.disputes,
        documentId: disputeId,
        data: {
          status: action,
          reviewed_at: reviewedAt,
        },
      });
    } catch (e) {
      console.error('admin-disputes update', e);
      return jsonResponse(500, { error: 'Failed to update dispute' });
    }

    const recordId = dispute.record_id;
    if (recordId) {
      if (action === 'resolved_removed') {
        try {
          await databases.updateDocument({
            databaseId,
            collectionId: collections.records,
            documentId: recordId,
            data: { status: 'removed' },
          });
        } catch (e) {
          console.error('admin-disputes record removed', e);
        }
      } else if (action === 'resolved_retained') {
        try {
          await databases.updateDocument({
            databaseId,
            collectionId: collections.records,
            documentId: recordId,
            data: { status: 'active' },
          });
        } catch (e) {
          console.error('admin-disputes record active', e);
        }
      }
    }

    return jsonResponse(200, { success: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
