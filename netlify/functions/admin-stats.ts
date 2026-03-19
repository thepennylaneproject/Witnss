import type { Handler } from '@netlify/functions';
import { Query } from 'node-appwrite';
import {
  getAuthBearerToken,
  verifyAdminSession,
  jsonResponse,
} from './_adminAuth';
import { getAppwriteServer } from './_appwriteServer';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

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

  try {
    const [activeRecords, pendingSubmissions, openDisputes, recordsUnderReview] = await Promise.all([
      databases.listDocuments({
        databaseId,
        collectionId: collections.records,
        queries: [Query.equal('status', 'active')],
        total: true,
      }),
      databases.listDocuments({
        databaseId,
        collectionId: collections.submissions,
        queries: [
          Query.or([Query.equal('review_status', 'pending'), Query.equal('review_status', 'corroborated')]),
        ],
        total: true,
      }),
      databases.listDocuments({
        databaseId,
        collectionId: collections.disputes,
        queries: [
          Query.or([Query.equal('status', 'pending'), Query.equal('status', 'under_review')]),
        ],
        total: true,
      }),
      databases.listDocuments({
        databaseId,
        collectionId: collections.records,
        queries: [Query.equal('status', 'under_review')],
        total: true,
      }),
    ]);

    const { documents: recentSubmissionDocs } = await databases.listDocuments({
      databaseId,
      collectionId: collections.submissions,
      queries: [Query.orderDesc('$createdAt'), Query.limit(10)],
    });

    const { documents: disputesRows } = await databases.listDocuments({
      databaseId,
      collectionId: collections.disputes,
      queries: [Query.orderDesc('$createdAt'), Query.limit(10)],
    });

    const recordIds = (disputesRows ?? [])
      .map((d) => (d as { record_id?: string }).record_id)
      .filter(Boolean) as string[];
    let recordToPerson: Record<string, { full_name: string }> = {};
    for (const rid of recordIds) {
      try {
        const rec = await databases.getDocument(databaseId, collections.records, rid);
        const personId = (rec as { person_id?: string }).person_id;
        if (personId) {
          const person = await databases.getDocument(databaseId, collections.persons, personId);
          recordToPerson[rid] = { full_name: String((person as { full_name?: string }).full_name ?? '—') };
        } else {
          recordToPerson[rid] = { full_name: '—' };
        }
      } catch {
        recordToPerson[rid] = { full_name: '—' };
      }
    }

    const recentSubmissions = (recentSubmissionDocs ?? []).map((s) => ({
      id: s.$id,
      subject_name: (s as { subject_name?: string }).subject_name,
      incident_type: (s as { incident_type?: string }).incident_type,
      created_at: s.$createdAt,
    }));

    const recentDisputes = (disputesRows ?? []).map((d) => {
      const record_id = String((d as { record_id?: string }).record_id ?? '');
      const claim = String((d as { claim?: string }).claim ?? '');
      return {
        id: d.$id,
        record_id,
        subject_name: recordToPerson[record_id]?.full_name ?? '—',
        claim_preview: claim.split('\n')[0]?.slice(0, 60) ?? '',
        created_at: d.$createdAt,
      };
    });

    return jsonResponse(200, {
      counts: {
        activeRecords: activeRecords.total ?? 0,
        pendingSubmissions: pendingSubmissions.total ?? 0,
        openDisputes: openDisputes.total ?? 0,
        recordsUnderReview: recordsUnderReview.total ?? 0,
      },
      recentSubmissions,
      recentDisputes,
    });
  } catch (err) {
    console.error('admin-stats error', err);
    return jsonResponse(500, { error: 'Failed to load stats' });
  }
};
