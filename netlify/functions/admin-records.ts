import type { Handler } from '@netlify/functions';
import { ID, Query } from 'node-appwrite';
import {
  getAuthBearerToken,
  verifyAdminSession,
  jsonResponse,
} from './_adminAuth';
import { getAppwriteServer } from './_appwriteServer';

const VALID_STATUSES = ['active', 'disputed', 'under_review', 'removed'];
const SOURCE_TYPES = ['conviction', 'protective_order', 'police_report', 'civil_filing', 'survivor_submission'];
const OFFENSE_TYPES = [
  'domestic_assault', 'domestic_battery', 'strangulation', 'stalking', 'harassment',
  'sexual_assault', 'child_endangerment', 'violation_of_protective_order', 'other',
];

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
    const q = (event.queryStringParameters?.q ?? '').trim();
    const qLower = q.toLowerCase();

    try {
      let recordDocs: Array<Record<string, unknown> & { $id: string; person_id?: string; $createdAt: string }>;

      if (q) {
        const { documents: allPersons } = await databases.listDocuments({
          databaseId,
          collectionId: collections.persons,
          queries: [Query.limit(5000)],
        });
        const personIds = (allPersons ?? [])
          .filter((p) => String((p as { full_name?: string }).full_name ?? '').toLowerCase().includes(qLower))
          .map((p) => p.$id);

        if (personIds.length > 0) {
          const personFilter =
            personIds.length === 1
              ? Query.equal('person_id', personIds[0])
              : Query.or(personIds.map((id) => Query.equal('person_id', id)));
          const { documents } = await databases.listDocuments({
            databaseId,
            collectionId: collections.records,
            queries: [personFilter, Query.orderDesc('$createdAt'), Query.limit(500)],
          });
          recordDocs = (documents ?? []) as typeof recordDocs;
        } else {
          const { documents } = await databases.listDocuments({
            databaseId,
            collectionId: collections.records,
            queries: [
              Query.contains('$id', q),
              Query.orderDesc('$createdAt'),
              Query.limit(500),
            ],
          });
          recordDocs = (documents ?? []) as typeof recordDocs;
        }
      } else {
        const { documents } = await databases.listDocuments({
          databaseId,
          collectionId: collections.records,
          queries: [Query.orderDesc('$createdAt'), Query.limit(500)],
        });
        recordDocs = (documents ?? []) as typeof recordDocs;
      }

      const personIds = [...new Set(recordDocs.map((r) => r.person_id).filter(Boolean))] as string[];
      const personMap: Record<string, string> = {};
      for (const pid of personIds) {
        try {
          const p = await databases.getDocument(databaseId, collections.persons, pid);
          personMap[pid] = String((p as { full_name?: string }).full_name ?? '—');
        } catch {
          personMap[pid] = '—';
        }
      }

      const records = recordDocs.map((r) => ({
        id: r.$id,
        person_id: r.person_id,
        full_name: personMap[r.person_id as string] ?? '—',
        tier: r.tier,
        offense_type: r.offense_type,
        offense_date: r.offense_date,
        jurisdiction_state: r.jurisdiction_state,
        jurisdiction_county: r.jurisdiction_county,
        source_type: r.source_type,
        status: r.status,
        created_at: r.$createdAt,
      }));

      return jsonResponse(200, { records });
    } catch (e) {
      console.error('admin-records GET', e);
      return jsonResponse(500, { error: 'Failed to list records' });
    }
  }

  if (event.httpMethod === 'POST') {
    let body: {
      tier?: number;
      full_name?: string;
      state?: string;
      county?: string | null;
      offense_type?: string;
      offense_date?: string | null;
      jurisdiction_state?: string;
      jurisdiction_county?: string | null;
      source_type?: string;
      source_reference?: string | null;
    };
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const tier = body.tier === 1 || body.tier === 2 ? body.tier : null;
    const fullName = body.full_name?.trim();
    const state = body.state?.trim();
    if (!tier || !fullName || !state) {
      return jsonResponse(400, { error: 'tier (1 or 2), full_name, and state are required' });
    }
    if (!OFFENSE_TYPES.includes(body.offense_type ?? '')) {
      return jsonResponse(400, { error: 'Valid offense_type is required' });
    }
    if (!SOURCE_TYPES.includes(body.source_type ?? '')) {
      return jsonResponse(400, { error: 'Valid source_type is required' });
    }

    const personId = ID.unique();
    const recordId = ID.unique();

    try {
      await databases.createDocument({
        databaseId,
        collectionId: collections.persons,
        documentId: personId,
        data: {
          full_name: fullName,
          name_aliases: '[]',
          dob_approximate: null,
          state,
          county: body.county?.trim() || null,
        },
      });
    } catch (e) {
      console.error('admin-records POST person', e);
      return jsonResponse(500, { error: 'Failed to create person' });
    }

    try {
      await databases.createDocument({
        databaseId,
        collectionId: collections.records,
        documentId: recordId,
        data: {
          person_id: personId,
          tier,
          offense_type: body.offense_type,
          offense_date: body.offense_date?.trim() || null,
          jurisdiction_state: body.jurisdiction_state?.trim() ?? state,
          jurisdiction_county: body.jurisdiction_county?.trim() || null,
          source_type: body.source_type,
          source_reference: body.source_reference?.trim() || null,
          verified_at: null,
          status: 'active',
        },
      });
    } catch (e) {
      console.error('admin-records POST record', e);
      try {
        await databases.deleteDocument(databaseId, collections.persons, personId);
      } catch {
        /* ignore */
      }
      return jsonResponse(500, { error: 'Failed to create record' });
    }

    return jsonResponse(200, { success: true, record_id: recordId, person_id: personId });
  }

  if (event.httpMethod === 'PATCH') {
    let body: { record_id?: string; status?: string };
    try {
      body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
    } catch {
      return jsonResponse(400, { error: 'Invalid JSON body' });
    }

    const recordId = body.record_id?.trim();
    const status = body.status;
    if (!recordId || !status || !VALID_STATUSES.includes(status)) {
      return jsonResponse(400, { error: 'record_id and valid status are required' });
    }

    try {
      await databases.updateDocument({
        databaseId,
        collectionId: collections.records,
        documentId: recordId,
        data: { status },
      });
    } catch (e) {
      console.error('admin-records PATCH', e);
      return jsonResponse(500, { error: 'Failed to update record' });
    }

    return jsonResponse(200, { success: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
