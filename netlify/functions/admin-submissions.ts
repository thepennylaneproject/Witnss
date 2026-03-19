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
    const { data: submissions, error } = await supabase
      .from('submissions')
      .select('id, subject_name, subject_state, subject_county, incident_type, incident_date, jurisdiction_state, description, supporting_doc_url, submission_hash, review_status, corroboration_count, created_at')
      .in('review_status', ['pending', 'corroborated'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('admin-submissions GET', error);
      return jsonResponse(500, { error: 'Failed to list submissions' });
    }

    return jsonResponse(200, {
      submissions: (submissions ?? []).map((s) => ({
        id: s.id,
        subject_name: s.subject_name,
        subject_state: s.subject_state,
        incident_type: s.incident_type,
        created_at: s.created_at,
        corroboration_count: s.corroboration_count ?? 1,
        supporting_doc_url: s.supporting_doc_url,
        review_status: s.review_status,
      })),
    });
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
      const { error: updateError } = await supabase
        .from('submissions')
        .update({ review_status: 'rejected' })
        .eq('id', submissionId);
      if (updateError) {
        console.error('admin-submissions reject', updateError);
        return jsonResponse(500, { error: 'Failed to reject submission' });
      }
      return jsonResponse(200, { success: true });
    }

    if (action === 'approve') {
      const { data: sub, error: fetchError } = await supabase
        .from('submissions')
        .select('*')
        .eq('id', submissionId)
        .single();
      if (fetchError || !sub) {
        return jsonResponse(404, { error: 'Submission not found' });
      }
      if (sub.review_status === 'approved') {
        return jsonResponse(400, { error: 'Submission already approved' });
      }

      const personId = crypto.randomUUID();
      const recordId = crypto.randomUUID();
      const now = new Date().toISOString();

      const { error: insertPersonError } = await supabase.from('persons').insert({
        id: personId,
        full_name: sub.subject_name,
        name_aliases: [],
        dob_approximate: null,
        state: sub.subject_state,
        county: sub.subject_county,
      });

      if (insertPersonError) {
        console.error('admin-submissions approve person', insertPersonError);
        return jsonResponse(500, { error: 'Failed to create person' });
      }

      const { error: insertRecordError } = await supabase.from('records').insert({
        id: recordId,
        person_id: personId,
        tier: 3,
        offense_type: sub.incident_type,
        offense_date: sub.incident_date,
        jurisdiction_state: sub.jurisdiction_state ?? sub.subject_state,
        jurisdiction_county: sub.subject_county,
        source_type: 'survivor_submission',
        source_reference: null,
        verified_at: null,
        status: 'active',
      });

      if (insertRecordError) {
        console.error('admin-submissions approve record', insertRecordError);
        await supabase.from('persons').delete().eq('id', personId);
        return jsonResponse(500, { error: 'Failed to create record' });
      }

      const { error: updateSubError } = await supabase
        .from('submissions')
        .update({ review_status: 'approved' })
        .eq('id', submissionId);

      if (updateSubError) {
        console.error('admin-submissions approve update submission', updateSubError);
        await supabase.from('records').delete().eq('id', recordId);
        await supabase.from('persons').delete().eq('id', personId);
        return jsonResponse(500, { error: 'Failed to update submission' });
      }

      return jsonResponse(200, { success: true, record_id: recordId, person_id: personId });
    }

    return jsonResponse(400, { error: 'Invalid action' });
  }

  return jsonResponse(405, { error: 'Method not allowed' });
};
