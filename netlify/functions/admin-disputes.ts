import type { Handler } from '@netlify/functions';
import {
  getAuthBearerToken,
  verifyAdminSession,
  getServiceRoleClient,
  jsonResponse,
} from './_adminAuth';

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
    const { data: disputes, error: disputesError } = await supabase
      .from('disputes')
      .select('id, record_id, claim, evidence_url, status, created_at')
      .in('status', ['pending', 'under_review'])
      .order('created_at', { ascending: false });

    if (disputesError) {
      console.error('admin-disputes GET', disputesError);
      return jsonResponse(500, { error: 'Failed to list disputes' });
    }

    const list = disputes ?? [];
    const recordIds = [...new Set(list.map((d) => d.record_id).filter(Boolean))];
    let recordToPerson: Record<string, string> = {};
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
      const personMap = Object.fromEntries((persons ?? []).map((p) => [p.id, p.full_name]));
      recordToPerson = Object.fromEntries(
        (records ?? []).map((r) => [r.id, personMap[r.person_id] ?? '—']),
      );
    }

    const disputesWithSubject = list.map((d) => ({
      id: d.id,
      record_id: d.record_id,
      subject_name: recordToPerson[d.record_id] ?? '—',
      claim_preview: (d.claim ?? '').split('\n')[0]?.replace(/^Nature:\s*/i, '').slice(0, 60) ?? '',
      created_at: d.created_at,
      evidence_url: d.evidence_url,
      status: d.status,
    }));

    return jsonResponse(200, { disputes: disputesWithSubject });
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

    const { data: dispute, error: fetchError } = await supabase
      .from('disputes')
      .select('id, record_id')
      .eq('id', disputeId)
      .single();

    if (fetchError || !dispute) {
      return jsonResponse(404, { error: 'Dispute not found' });
    }

    const reviewedAt = new Date().toISOString();

    const { error: updateDisputeError } = await supabase
      .from('disputes')
      .update({
        status: action,
        reviewed_at: reviewedAt,
      })
      .eq('id', disputeId);

    if (updateDisputeError) {
      console.error('admin-disputes update', updateDisputeError);
      return jsonResponse(500, { error: 'Failed to update dispute' });
    }

    if (action === 'resolved_removed') {
      await supabase
        .from('records')
        .update({ status: 'removed' })
        .eq('id', dispute.record_id);
    } else if (action === 'resolved_retained') {
      await supabase
        .from('records')
        .update({ status: 'active' })
        .eq('id', dispute.record_id);
    }

    return jsonResponse(200, { success: true });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
