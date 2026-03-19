import type { Handler } from '@netlify/functions';
import Busboy from 'busboy';
import { createClient } from '@supabase/supabase-js';

const DESC_MIN = 100;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIMES = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const NATURE_LABELS: Record<string, string> = {
  misidentification: 'This record is not about me (misidentification)',
  expunged_or_vacated: 'This conviction/order has been expunged or vacated',
  factually_incorrect: 'The details of this record are factually incorrect',
  tier3_false: 'This is a Tier 3 submission and it is false',
  other: 'Other',
};

const NATURE_VALUES = Object.keys(NATURE_LABELS);

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
          file = {
            field: name,
            filename: info.filename ?? 'file',
            mime: info.mimeType ?? 'application/octet-stream',
            buffer,
          };
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

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
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

  const record_id = (fields.record_id ?? '').trim();
  const submitter_name = (fields.submitter_name ?? '').trim();
  const contact_email = (fields.contact_email ?? '').trim();
  const nature = (fields.nature ?? '').trim();
  const explanation = (fields.explanation ?? '').trim();
  const acknowledgment = fields.acknowledgment === 'true';

  if (!record_id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Record ID is required.' }),
    };
  }
  if (!submitter_name) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Your full name is required.' }),
    };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!contact_email) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Contact email is required.' }),
    };
  }
  if (!emailRegex.test(contact_email)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Please enter a valid email address.' }),
    };
  }
  if (!NATURE_VALUES.includes(nature)) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Please select a valid nature of dispute.' }),
    };
  }
  if (explanation.length < DESC_MIN) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: `Detailed explanation must be at least ${DESC_MIN} characters.` }),
    };
  }
  if (!acknowledgment) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'You must acknowledge the terms before submitting.' }),
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

  const claimLabel = NATURE_LABELS[nature] ?? nature;
  const claim = `Nature: ${claimLabel}\n\n${explanation}`;

  const supabase = createClient(url, serviceKey);
  const disputeId = crypto.randomUUID();

  let evidence_url: string | null = null;
  if (file && file.buffer.length > 0) {
    const ext = file.mime === 'application/pdf' ? 'pdf' : file.mime.startsWith('image/') ? 'jpg' : 'bin';
    const safeName = (file.filename || 'document').replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 80) || 'document';
    const storagePath = `disputes/${disputeId}/${safeName}.${ext}`;
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
    evidence_url = storagePath;
  }

  const { error: insertError } = await supabase.from('disputes').insert({
    id: disputeId,
    record_id,
    submitter_name,
    submitter_contact: contact_email,
    claim,
    evidence_url,
    status: 'pending',
  });

  if (insertError) {
    console.error('Dispute insert error', insertError);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Dispute submission failed. Please try again.' }),
    };
  }

  const { error: updateError } = await supabase
    .from('records')
    .update({ status: 'disputed' })
    .eq('id', record_id);

  if (updateError) {
    console.error('Record status update error', updateError);
    // Dispute was created; don't fail the request, but log for follow-up
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ success: true }),
  };
};
