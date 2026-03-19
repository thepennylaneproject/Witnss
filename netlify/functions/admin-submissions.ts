import type { Handler } from '@netlify/functions';
import { ID, Query } from 'node-appwrite';
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
      const { documents: submissions } = await databases.listDocuments({
        databaseId,
        collectionId: collections.submissions,
        queries: [
          Query.or([Query.equal('review_status', 'pending'), Query.equal('review_status', 'corroborated')]),
          Query.orderDesc('$createdAt'),
          Query.limit(500),
        ],
      });

      return jsonResponse(200, {
        submissions: (submissions ?? []).map((s) => ({
          id: s.$id,
          subject_name: (s as { subject_name?: string }).subject_name,
          subject_state: (s as { subject_state?: string }).subject_state,
          incident_type: (s as { incident_type?: string }).incident_type,
          created_at: s.$createdAt,
          corroboration_count: (s as { corroboration_count?: number }).corroboration_count ?? 1,
          supporting_doc_url: (s as { supporting_doc_url?: string | null }).supporting_doc_url ?? null,
          review_status: (s as { review_status?: string }).review_status,
        })),
      });
    } catch (e) {
      console.error('admin-submissions GET', e);
      return jsonResponse(500, { error: 'Failed to list submissions' });
    }
  }

  if (event.httpMethod === 'POST') {
    let body: { action?: string; submission_id?: string };
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const action = body.action;
    const submissionId = body.submission_id?.trim();
    if (!submissionId || !action) {
      return jsonResponse(400, { error: 'action and submission_id are required' });
    }

    if (action === 'reject') {
      try {
        await databases.updateDocument({
          databaseId,
          collectionId: collections.submissions,
          documentId: submissionId,
          data: { review_status: 'rejected' },
        });
      } catch (e) {
        console.error('admin-submissions reject', e);
        return jsonResponse(500, { error: 'Failed to reject submission' });
      }
      return jsonResponse(200, { success: true });
    }

    if (action === 'approve') {
      let sub: Record<string, unknown> & { $id: string };
      try {
        sub = (await databases.getDocument(
          databaseId,
          collections.submissions,
          submissionId,
        )) as typeof sub;
      } catch {
        return jsonResponse(404, { error: 'Submission not found' });
      }
      if (sub.review_status === 'approved') {
        return jsonResponse(400, { error: 'Submission already approved' });
      }

      const personId = ID.unique();
      const recordId = ID.unique();

      try {
        await databases.createDocument({
          databaseId,
          collectionId: collections.persons,
          documentId: personId,
          data: {
            full_name: sub.subject_name,
            name_aliases: '[]',
            dob_approximate: null,
            state: sub.subject_state,
            county: sub.subject_county ?? null,
          },
        });
      } catch (e) {
        console.error('admin-submissions approve person', e);
        return jsonResponse(500, { error: 'Failed to create person' });
      }

      try {
        await databases.createDocument({
          databaseId,
          collectionId: collections.records,
          documentId: recordId,
          data: {
            person_id: personId,
            tier: 3,
            offense_type: sub.incident_type,
            offense_date: sub.incident_date ?? null,
            jurisdiction_state: sub.jurisdiction_state ?? sub.subject_state,
            jurisdiction_county: sub.subject_county ?? null,
            source_type: 'survivor_submission',
            source_reference: null,
            verified_at: null,
            status: 'active',
          },
        });
      } catch (e) {
        console.error('admin-submissions approve record', e);
        try {
          await databases.deleteDocument(databaseId, collections.persons, personId);
        } catch {
          /* ignore */
        }
        return jsonResponse(500, { error: 'Failed to create record' });
      }

      try {
        await databases.updateDocument({
          databaseId,
          collectionId: collections.submissions,
          documentId: submissionId,
          data: { review_status: 'approved' },
        });
      } catch (e) {
        console.error('admin-submissions approve update submission', e);
        try {
          await databases.deleteDocument(databaseId, collections.records, recordId);
          await databases.deleteDocument(databaseId, collections.persons, personId);
        } catch {
          /* ignore */
        }
        return jsonResponse(500, { error: 'Failed to update submission' });
      }

      return jsonResponse(200, { success: true, record_id: recordId, person_id: personId });
    }

    return jsonResponse(400, { error: 'Invalid action' });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
