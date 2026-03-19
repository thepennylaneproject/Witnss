import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

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

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Server configuration error' }),
    };
  }

  const supabase = createClient(url, serviceKey);

  const { data: record, error: recordError } = await supabase
    .from('records')
    .select('*')
    .eq('id', id)
    .single();

  if (recordError || !record) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Record not found.' }),
    };
  }

  const status = (record as { status?: string }).status;
  if (status === 'removed') {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Record not found.' }),
    };
  }

  const personId = (record as { person_id?: string }).person_id;
  const { data: person, error: personError } = await supabase
    .from('persons')
    .select('id, full_name, name_aliases, dob_approximate, state, county, created_at')
    .eq('id', personId)
    .single();

  if (personError || !person) {
    return {
      statusCode: 404,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Record not found.' }),
    };
  }

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      record: {
        ...record,
        person_id: personId,
      },
      person: {
        ...person,
        name_aliases: Array.isArray(person.name_aliases) ? person.name_aliases : [],
      },
    }),
  };
};
