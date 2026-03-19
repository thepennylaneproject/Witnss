import type { Handler } from '@netlify/functions';
import {
  getAuthBearerToken,
  verifyAdminSession,
  jsonResponse,
} from './_adminAuth';
import { getAppwriteServer } from './_appwriteServer';

/**
 * Returns the file bytes (not a JSON URL). Admin UI should use fetch + blob + object URL.
 * Body: { fileId?: string, path?: string } — `path` is accepted for legacy clients (treated as Appwrite file ID).
 */
export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' });
  }

  const token = getAuthBearerToken(event.headers ?? {});
  const auth = await verifyAdminSession(token);
  if (!auth.authorized) {
    return jsonResponse(401, { error: auth.error ?? 'Unauthorized' });
  }

  let body: { path?: string; fileId?: string };
  try {
    body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body ?? {};
  } catch {
    return jsonResponse(400, { error: 'Invalid JSON body' });
  }

  const fileId = (typeof body.fileId === 'string' ? body.fileId : body.path)?.trim();
  if (!fileId) {
    return jsonResponse(400, { error: 'fileId (or path) is required' });
  }

  const aw = getAppwriteServer();
  if (!aw) {
    return jsonResponse(500, { error: 'Server configuration error' });
  }

  const { storage, bucketEvidence } = aw;

  try {
    const meta = await storage.getFile({ bucketId: bucketEvidence, fileId });
    const arrayBuffer = await storage.getFileDownload({ bucketId: bucketEvidence, fileId });
    const buf = Buffer.from(arrayBuffer);

    const safeName = (meta.name || 'document').replace(/[^\w.-]+/g, '_').slice(0, 120) || 'document';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': meta.mimeType || 'application/octet-stream',
        'Content-Disposition': `inline; filename="${safeName}"`,
        'Cache-Control': 'private, max-age=60',
      },
      body: buf.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (e) {
    console.error('admin-signed-url error', e);
    return jsonResponse(500, { error: 'Failed to load file' });
  }
};
