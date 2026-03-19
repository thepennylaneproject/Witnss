import type { Handler } from '@netlify/functions';
import {
  getAuthBearerToken,
  verifyAdminSession,
  getServiceRoleClient,
  jsonResponse,
} from './_adminAuth';

const EVIDENCE_BUCKET = 'evidence';
const EXPIRES_IN = 3600; // 1 hour

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const token = getAuthBearerToken(event.headers ?? {});
  const auth = await verifyAdminSession(token);
  if (!auth.authorized) {
    return jsonResponse(401, { error: auth.error ?? 'Unauthorized' });
  }

  let body: { path?: string };
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const path = typeof body.path === 'string' ? body.path.trim() : null;
  if (!path) {
    return jsonResponse(400, { error: 'path is required' });
  }

  const supabase = getServiceRoleClient();
  if (!supabase) {
    return jsonResponse(500, { error: 'Server configuration error' });
  }

  const { data, error } = await supabase.storage
    .from(EVIDENCE_BUCKET)
    .createSignedUrl(path, EXPIRES_IN);

  if (error) {
    console.error('admin-signed-url error', error);
    return jsonResponse(500, { error: 'Failed to create signed URL' });
  }

  return jsonResponse(200, { url: data?.signedUrl ?? null });
};
