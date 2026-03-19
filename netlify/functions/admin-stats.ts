import type { Handler } from '@netlify/functions';
import {
  getAuthBearerToken,
  verifyAdminSession,
  getServiceRoleClient,
  jsonResponse,
} from './_adminAuth';

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const token = getAuthBearerToken(event.headers ?? {});
  const auth = await verifyAdminSession(token);
  if (!auth.authorized) {
    return jsonResponse(401, { error: auth.error ?? 'Unauthorized' });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonResponse(500, { error: 'Server configuration error' });
  }

  try {
    const [
      { count: activeRecords },
      { count: pendingSubmissions },
      { count: openDisputes },
      { count: recordsUnderReview },
    ] = await Promise.all([
      supabase.from('records').select('*', { count: 'exact', head: true }).eq('status', 'active'),
      supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .in('review_status', ['pending', 'corroborated']),
      supabase
        .from('disputes')
        .select('*', { count: 'exact', head: true })
        .in('status', ['pending', 'under_review']),
      supabase
        .from('records')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'under_review'),
    ]);

    const { data: recentSubmissions } = await supabase
      .from('submissions')
      .select('id, subject_name, incident_type, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const { data: disputesRows } = await supabase
      .from('disputes')
      .select('id, record_id, claim, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    const recordIds = (disputesRows ?? []).map((d) => d.record_id).filter(Boolean);
    let recordToPerson: Record<string, { full_name: string }> = {};
    if (recordIds.length > 0) {
      const { data: records } = await supabase
        .from('records')
        .select('id, person_id')
        .in('id', recordIds);
      const personIds = [...new Set((records ?? []).map((r) => r.person_id))];
      const { data: persons } = await supabase
        .from('persons')
        .select('id, full_name')
        .in('id', personIds);
      const personMap = Object.fromEntries((persons ?? []).map((p) => [p.id, p]));
      recordToPerson = Object.fromEntries(
        (records ?? []).map((r) => [
          r.id,
          { full_name: personMap[r.person_id]?.full_name ?? '—' },
        ]),
      );
    }

    const recentDisputes = (disputesRows ?? []).map((d) => ({
      id: d.id,
      record_id: d.record_id,
      subject_name: recordToPerson[d.record_id]?.full_name ?? '—',
      claim_preview: (d.claim ?? '').split('\n')[0]?.slice(0, 60) ?? '',
      created_at: d.created_at,
    }));

    return jsonResponse(200, {
      counts: {
        activeRecords: activeRecords ?? 0,
        pendingSubmissions: pendingSubmissions ?? 0,
        openDisputes: openDisputes ?? 0,
        recordsUnderReview: recordsUnderReview ?? 0,
      },
      recentSubmissions: recentSubmissions ?? [],
      recentDisputes,
    });
  } catch (err) {
    console.error('admin-stats error', err);
    return jsonResponse(500, { error: 'Failed to load stats' });
  }
};
