import type { Handler } from '@netlify/functions';
import { Query } from 'node-appwrite';
import { getAppwriteServer } from './_appwriteServer';

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

  if (!q) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ results: [], total: 0 }),
    };
  }

  const aw = getAppwriteServer();
  if (!aw) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Search not configured' }),
    };
  }

  const { databases, databaseId, collections } = aw;
  const qLower = q.toLowerCase();

  try {
    const personQueries: string[] = [Query.limit(5000)];
    if (state) personQueries.push(Query.equal('state', state));

    const { documents: personDocs } = await databases.listDocuments({
      databaseId,
      collectionId: collections.persons,
      queries: personQueries,
    });

    const personList = (personDocs ?? []).filter((p) => {
      const name = String((p as { full_name?: string }).full_name ?? '').toLowerCase();
      return name.includes(qLower);
    });

    const personIds = personList.map((p) => p.$id);
    if (personIds.length === 0) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ results: [], total: 0 }),
      };
    }

    const personFilter =
      personIds.length === 1
        ? Query.equal('person_id', personIds[0])
        : Query.or(personIds.map((id) => Query.equal('person_id', id)));

    const recordQueries: string[] = [
      Query.equal('status', 'active'),
      personFilter,
      Query.limit(5000),
    ];
    if (tiers.length > 0) {
      recordQueries.push(Query.equal('tier', tiers));
    }
    if (offenseTypes.length > 0) {
      recordQueries.push(Query.equal('offense_type', offenseTypes));
    }

    const { documents: recordDocs } = await databases.listDocuments({
      databaseId,
      collectionId: collections.records,
      queries: recordQueries,
    });

    const recordList = (recordDocs ?? []) as Array<{
      $id: string;
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
      $createdAt: string;
    }>;

    const personById = new Map(
      personList.map((p) => [
        p.$id,
        {
          id: p.$id,
          full_name: (p as { full_name?: string }).full_name,
          name_aliases: parseNameAliases((p as { name_aliases?: unknown }).name_aliases),
          dob_approximate: (p as { dob_approximate?: string | null }).dob_approximate ?? null,
          state: (p as { state?: string }).state,
          county: (p as { county?: string | null }).county ?? null,
          created_at: p.$createdAt,
        },
      ]),
    );

    const recordsByPerson = new Map<string, typeof recordList>();
    for (const rec of recordList) {
      const list = recordsByPerson.get(rec.person_id) ?? [];
      list.push(rec);
      recordsByPerson.set(rec.person_id, list);
    }

    const results: Array<{ person: unknown; records: unknown[] }> = [];
    for (const person of personList) {
      const recs = recordsByPerson.get(person.$id) ?? [];
      if (recs.length === 0) continue;
      results.push({
        person: personById.get(person.$id),
        records: recs.map((r) => ({
          id: r.$id,
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
          created_at: r.$createdAt,
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
