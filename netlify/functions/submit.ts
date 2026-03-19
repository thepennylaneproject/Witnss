import type { Handler } from '@netlify/functions';
import Busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

const RATE_LIMIT_PER_IP = 3;
const RATE_LIMIT_WINDOW_MS = 24 * 60 * 60 * 1000; // 24h

/** In-memory rate limit (resets on cold start). For production, use Redis or DB. */
const ipCounts = new Map<string, { count: number; resetAt: number }>();

function getClientIp(event: { headers?: Record<string, string | undefined> }): string {
  return (
    event.headers?.['x-nf-client-connection-ip'] ??
    event.headers?.['x-forwarded-for']?.split(',')[0]?.trim() ??
    'unknown'
  );
}

function checkRateLimit(ip: string): { allowed: boolean; message?: string } {
  const now = Date.now();
  const entry = ipCounts.get(ip);
  if (!entry) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (now >= entry.resetAt) {
    ipCounts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }
  if (entry.count >= RATE_LIMIT_PER_IP) {
    return {
      allowed: false,
      message: 'Too many submissions. Please try again in 24 hours.',
    };
  }
  entry.count += 1;
  return { allowed: true };
}

const OFFENSE_TYPES = [
  'domestic_assault',
  'domestic_battery',
  'strangulation',
  'stalking',
  'harassment',
  'sexual_assault',
  'child_endangerment',
  'violation_of_protective_order',
  'other',
] as const;

function isValidOffenseType(s: string): s is (typeof OFFENSE_TYPES)[number] {
  return OFFENSE_TYPES.includes(s as (typeof OFFENSE_TYPES)[number]);
}

const DESC_MIN = 100;
const DESC_MAX = 2000;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

function parseMultipart(
  event: { headers: Record<string, string | undefined>; body: string | null; isBase64Encoded?: boolean },
): Promise<{ fields: Record<string, string>; file?: { field: string; filename: string; mime: string; buffer: Buffer } }> {
  return new Promise((resolve, reject) => {
    const contentType = event.headers['content-type'] ?? '';
    const fields: Record<string, string> = {};
    let file: { field: string; filename: string; mime: string; buffer: Buffer } | undefined;

    let body: Buffer;
    if (event.body) {
      body = event.isBase64Encoded ? Buffer.from(event.body, 'base64') : Buffer.from(event.body, 'utf8');
    } else {
      body = Buffer.alloc(0);
    }

    const busboy = Busboy({ headers: { 'content-type': contentType } });

    busboy.on('field', (name, value) => {
      fields[name] = value;
    });

    busboy.on('file', (name, stream, info) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk: Buffer) => chunks.push(chunk));
      stream.on('end', () => {
        const buffer = Buffer.concat(chunks);
        if (buffer.length > 0) {
          file = { field: name, filename: info.filename ?? 'file', mime: info.mimeType ?? 'application/octet-stream', buffer };
        }
      });
      stream.resume();
    });

    busboy.on('finish', () => resolve({ fields, file }));
    busboy.on('error', reject);
    busboy.write(body);
    busboy.end();
  });
}

function submissionHash(subjectName: string, subjectState: string, incidentType: string): string {
  const normalized = `${subjectName.toLowerCase().trim()}|${subjectState}|${incidentType}`;
  return createHash('sha256').update(normalized).digest('hex');
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const ip = getClientIp(event);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    return {
      statusCode: 429,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: rate.message }),
    };
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  let fields: Record<string, string>;
  let file: { field: string; filename: string; mime: string; buffer: Buffer } | undefined;
  try {
    const parsed = await parseMultipart({
      headers: event.headers ?? {},
      body: event.body ?? null,
      isBase64Encoded: event.isBase64Encoded,
    });
    fields = parsed.fields;
    file = parsed.file;
  } catch (e) {
    console.error('Parse multipart error', e);
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid form data' }),
    };
  }

  const subject_name = (fields.subject_name ?? '').trim();
  const subject_state = (fields.subject_state ?? '').trim();
  const subject_county = (fields.subject_county ?? '').trim() || null;
  const incident_type = (fields.incident_type ?? '').trim();
  const incident_dateRaw = (fields.incident_date ?? '').trim();
  const description = (fields.description ?? '').trim();
  const contact_email = (fields.contact_email ?? '').trim() || null;

  if (!subject_name) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: "Subject's full name is required." }),
    };
  }
  if (!subject_state) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Subject state is required.' }),
    };
  }
  if (!isValidOffenseType(incident_type)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Invalid incident type.' }),
    };
  if (description.length < DESC_MIN) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Description must be at least ${DESC_MIN} characters.` }),
    };
  if (description.length > DESC_MAX) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Description must be no more than ${DESC_MAX} characters.` }),
    };
  }

  if (file) {
    if (file.buffer.length > MAX_FILE_SIZE) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File must be 10MB or smaller.' }),
      };
    }
    if (!ALLOWED_MIMES.includes(file.mime)) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'File must be PDF, JPG, or PNG.' }),
      };
    }
  }

  const hash = submissionHash(subject_name, subject_state, incident_type);
  const incident_date = incident_dateRaw ? `${incident_dateRaw}-01` : null; // YYYY-MM -> YYYY-MM-01 for date column

  const supabase = createClient(url, serviceKey);

  let supporting_doc_url: string | null = null;
  const submissionId = crypto.randomUUID();

  if (file && file.buffer.length > 0) {
    const ext = file.mime === 'application/pdf' ? 'pdf' : file.mime.startsWith('image/') ? 'jpg' : 'bin';
    const safeName = (file.filename || 'document').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80) || 'document';
    const storagePath = `submissions/${submissionId}/${safeName}.${ext}`;
    const { error: uploadError } = await supabase.storage.from('evidence').upload(storagePath, file.buffer, {
      contentType: file.mime,
      upsert: false,
    });
    if (uploadError) {
      console.error('Evidence upload error', uploadError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Failed to store document. Please try again.' }),
      };
    }
    // Store path for private bucket; admin can create signed URL for viewing
    supporting_doc_url = storagePath;
  }

  const { data: existing } = await supabase
    .from('submissions')
    .select('id, corroboration_count')
    .eq('submission_hash', hash);

  const existingList = existing ?? [];
  const newCount = existingList.length + 1;
  const reviewStatus = newCount >= 2 ? 'corroborated' : 'pending';

  const { error: insertError } = await supabase.from('submissions').insert({
    id: submissionId,
    subject_name,
    subject_state,
    subject_county,
    incident_type,
    incident_date,
    jurisdiction_state: subject_state,
    description,
    supporting_doc_url,
    submission_hash: hash,
    review_status: reviewStatus,
    corroboration_count: newCount,
  });

  if (insertError) {
    console.error('Submission insert error', insertError);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Submission failed. Please try again.' }),
    };
  }

  if (existingList.length > 0) {
    const ids = existingList.map((r) => r.id);
    await supabase
      .from('submissions')
      .update({ corroboration_count: newCount, review_status: 'corroborated' })
      .in('id', ids);
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
