import type { Handler } from '@netlify/functions';
import {
  getAuthBearerToken,
  verifyAdminSession,
  getServiceRoleClient,
  jsonResponse,
} from './_adminAuth';

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

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonResponse(500, { error: 'Server configuration error' });
  }

  if (event.httpMethod === 'GET') {
    const q = (event.queryStringParameters?.q ?? '').trim();
    let query = supabase
      .from('records')
      .select('id, person_id, tier, offense_type, offense_date, jurisdiction_state, jurisdiction_county, source_type, status, created_at')
      .order('created_at', { ascending: false });

    if (q) {
      const { data: personMatches } = await supabase
        .from('persons')
        .select('id')
        .ilike('full_name', `%${q}%`);
      const personIds = (personMatches ?? []).map((p) => p.id);
      if (personIds.length > 0) {
        query = query.in('person_id', personIds);
      } else {
        query = query.ilike('id', `%${q}%`);
      }
    }

    const { data: rows, error } = await query;

    if (error) {
      console.error('admin-records GET', error);
      return jsonResponse(500, { error: 'Failed to list records' });
    }

    const list = rows ?? [];
    const personIds = [...new Set(list.map((r) => r.person_id))];
    let personMap: Record<string, string> = {};
    if (personIds.length > 0) {
      const { data: persons } = await supabase
        .from('persons')
        .select('id, full_name')
        .in('id', personIds);
      personMap = Object.fromEntries((persons ?? []).map((p) => [p.id, p.full_name]));
    }

    const records = list.map((r) => ({
      id: r.id,
      person_id: r.person_id,
      full_name: personMap[r.person_id] ?? '—',
      tier: r.tier,
      offense_type: r.offense_type,
      offense_date: r.offense_date,
      jurisdiction_state: r.jurisdiction_state,
      jurisdiction_county: r.jurisdiction_county,
      source_type: r.source_type,
      status: r.status,
      created_at: r.created_at,
    }));

    return jsonResponse(200, { records });
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

    const personId = crypto.randomUUID();
    const recordId = crypto.randomUUID();

    const { error: insertPersonError } = await supabase.from('persons').insert({
      id: personId,
      full_name: fullName,
      name_aliases: [],
      dob_approximate: null,
      state,
      county: body.county?.trim() || null,
    });

    if (insertPersonError) {
      console.error('admin-records POST person', insertPersonError);
      return jsonResponse(500, { error: 'Failed to create person' });
    }

    const { error: insertRecordError } = await supabase.from('records').insert({
      id: recordId,
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
    });

    if (insertRecordError) {
      console.error('admin-records POST record', insertRecordError);
      await supabase.from('persons').delete().eq('id', personId);
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

    const { error: updateError } = await supabase
      .from('records')
      .update({ status })
      .eq('id', recordId);

    if (updateError) {
      console.error('admin-records PATCH', updateError);
      return jsonResponse(500, { error: 'Failed to update record' });
    }

    return jsonResponse(200, { success: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
