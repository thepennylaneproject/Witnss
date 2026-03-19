import type { Handler } from '@netlify/functions';
import { getAppwriteServer } from './_appwriteServer';

function parseNameAliases(raw: unknown): string[] {
  if (Array.isArray(raw)) return raw as string[];
  if (typeof raw === 'string') {
    try {
      const p = JSON.parse(raw);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  const id = (event.queryStringParameters?.id ?? '').trim();
  if (!id) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Record ID is required.' }),
    };
  }

  const aw = getAppwriteServer();
  if (!aw) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  const { databases, databaseId, collections } = aw;

  try {
    const record = await databases.getDocument(databaseId, collections.records, id);
    const status = (record as { status?: string }).status;
    if (status === 'removed') {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Record not found.' }),
      };
    }

    const personId = (record as { person_id?: string }).person_id;
    if (!personId) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Record not found.' }),
      };
    }

    const person = await databases.getDocument(databaseId, collections.persons, personId);

    const recordOut = {
      id: record.$id,
      person_id: personId,
      tier: (record as { tier?: number }).tier,
      offense_type: (record as { offense_type?: string }).offense_type,
      offense_date: (record as { offense_date?: string | null }).offense_date ?? null,
      jurisdiction_state: (record as { jurisdiction_state?: string }).jurisdiction_state,
      jurisdiction_county: (record as { jurisdiction_county?: string | null }).jurisdiction_county ?? null,
      source_type: (record as { source_type?: string }).source_type,
      source_reference: (record as { source_reference?: string | null }).source_reference ?? null,
      verified_at: (record as { verified_at?: string | null }).verified_at ?? null,
      status: (record as { status?: string }).status,
      created_at: record.$createdAt,
    };

    const personOut = {
      id: person.$id,
      full_name: (person as { full_name?: string }).full_name,
      name_aliases: parseNameAliases((person as { name_aliases?: unknown }).name_aliases),
      dob_approximate: (person as { dob_approximate?: string | null }).dob_approximate ?? null,
      state: (person as { state?: string }).state,
      county: (person as { county?: string | null }).county ?? null,
      created_at: person.$createdAt,
    };

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ record: recordOut, person: personOut }),
    };
  } catch (e) {
    console.error('record get', e);
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Record not found.' }),
    };
  }
};
