import type { Handler } from '@netlify/functions';
import { createClient } from '@supabase/supabase-js';

const PAGE_SIZE = 20;

type RecordTier = 1 | 2 | 3;

const TIER_VALUES: RecordTier[] = [1, 2, 3];

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

function parseTiers(tierParam: string | string[] | undefined): RecordTier[] {
  if (!tierParam) return [];
  const arr = Array.isArray(tierParam) ? tierParam : [tierParam];
  return arr
    .map((t) => parseInt(String(t), 10))
    .filter((t): t is RecordTier => TIER_VALUES.includes(t as RecordTier));
}

function parseOffenseTypes(
  offenseParam: string | string[] | undefined,
): string[] {
  if (!offenseParam) return [];
  const arr = Array.isArray(offenseParam) ? offenseParam : [offenseParam];
  return arr.filter((o) => OFFENSE_TYPES.includes(o as (typeof OFFENSE_TYPES)[number]));
}

export const handler: Handler = async (event) => {
  const q = (event.queryStringParameters?.q ?? '').trim();
  const state = (event.queryStringParameters?.state ?? '').trim();
  const tierParam = event.queryStringParameters?.tier;
  const offenseParam = event.queryStringParameters?.offense_type;
  const page = Math.max(
    1,
    parseInt(event.queryStringParameters?.page ?? '1', 10),
  );
  const limit = Math.min(
    PAGE_SIZE,
    Math.max(1, parseInt(event.queryStringParameters?.limit ?? String(PAGE_SIZE), 10)),
  );

  const tiers = parseTiers(tierParam);
  const offenseTypes = parseOffenseTypes(offenseParam);

  // Require a name query so we don't return the full table
  if (!q) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: [], total: 0 }),
    };
  }

  const url = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY;
  if (!url || !serviceKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Search not configured' }),
    };
  }

  const supabase = createClient(url, serviceKey);

  try {
    // 1) Get persons: by name (full_name ilike; name_aliases could be added via DB function) and state
    let personsQuery = supabase
      .from('persons')
      .select('id, full_name, name_aliases, dob_approximate, state, county, created_at');

    if (state) {
      personsQuery = personsQuery.eq('state', state);
    }
    if (q) {
      personsQuery = personsQuery.ilike('full_name', `%${q}%`);
    }

    const { data: persons, error: personsError } = await personsQuery;

    if (personsError) {
      console.error('persons query error', personsError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Search failed' }),
      };
    }

    const personList = persons ?? [];
    const personIds = personList.map((p) => p.id);
    if (personIds.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: [], total: 0 }),
      };
    }

    // 2) Get active records for these persons, with optional tier/offense filters
    let recordsQuery = supabase
      .from('records')
      .select('*')
      .eq('status', 'active')
      .in('person_id', personIds);

    if (tiers.length > 0) {
      recordsQuery = recordsQuery.in('tier', tiers);
    }
    if (offenseTypes.length > 0) {
      recordsQuery = recordsQuery.in('offense_type', offenseTypes);
    }

    const { data: records, error: recordsError } = await recordsQuery;

    if (recordsError) {
      console.error('records query error', recordsError);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Search failed' }),
      };
    }

    const recordList = (records ?? []) as Array<{
      id: string;
      person_id: string;
      tier: number;
      offense_type: string;
      offense_date: string | null;
      jurisdiction_state: string;
      jurisdiction_county: string | null;
      source_type: string;
      source_reference: string | null;
      verified_at: string | null;
      status: string;
      created_at: string;
    }>;

    // 3) Filter persons to those who have at least one matching record; group records by person
    const personById = new Map(
      personList.map((p) => [
        p.id,
        {
          id: p.id,
          full_name: p.full_name,
          name_aliases: Array.isArray(p.name_aliases) ? p.name_aliases : [],
          dob_approximate: p.dob_approximate ?? null,
          state: p.state,
          county: p.county ?? null,
          created_at: p.created_at,
        },
      ]),
    );

    const recordsByPerson = new Map<string, typeof recordList>();
    for (const rec of recordList) {
      const list = recordsByPerson.get(rec.person_id) ?? [];
      list.push(rec);
      recordsByPerson.set(rec.person_id, list);
    }

    // Only include persons that have at least one active record after filters
    const results: Array<{ person: unknown; records: unknown[] }> = [];
    for (const person of personList) {
      const recs = recordsByPerson.get(person.id) ?? [];
      if (recs.length === 0) continue;
      results.push({
        person: personById.get(person.id),
        records: recs.map((r) => ({
          id: r.id,
          person_id: r.person_id,
          tier: r.tier,
          offense_type: r.offense_type,
          offense_date: r.offense_date,
          jurisdiction_state: r.jurisdiction_state,
          jurisdiction_county: r.jurisdiction_county,
          source_type: r.source_type,
          source_reference: r.source_reference,
          verified_at: r.verified_at,
          status: r.status,
          created_at: r.created_at,
        })),
      });
    }

    const total = results.length;
    const offset = (page - 1) * limit;
    const paginated = results.slice(offset, offset + limit);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
      },
      body: JSON.stringify({ results: paginated, total }),
    };
  } catch (err) {
    console.error('search error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Search failed' }),
    };
  }
};
