import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { RecordCard } from '../components/records/RecordCard';
import type { SearchResult, RecordTier, OffenseType } from '../lib/types';
import { cn } from '../lib/utils';

const US_STATES = [
  '',
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
  'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
  'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
  'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
  'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
].filter(Boolean);

const TIERS: { value: RecordTier; label: string }[] = [
  { value: 1, label: 'Tier 1 — Verified' },
  { value: 2, label: 'Tier 2 — Documented' },
  { value: 3, label: 'Tier 3 — Community reported' },
];

const OFFENSE_OPTIONS: { value: OffenseType; label: string }[] = [
  { value: 'domestic_assault', label: 'Domestic Assault' },
  { value: 'domestic_battery', label: 'Domestic Battery' },
  { value: 'strangulation', label: 'Strangulation' },
  { value: 'stalking', label: 'Stalking' },
  { value: 'harassment', label: 'Harassment' },
  { value: 'sexual_assault', label: 'Sexual Assault' },
  { value: 'child_endangerment', label: 'Child Endangerment' },
  { value: 'violation_of_protective_order', label: 'Violation of Protective Order' },
  { value: 'other', label: 'Other' },
];

const PAGE_SIZE = 20;

function buildSearchUrl(params: URLSearchParams): string {
  const base = '/.netlify/functions/search';
  const qs = params.toString();
  return qs ? `${base}?${qs}` : base;
}

function RecordCardSkeleton() {
  return (
    <Card padding="md" bordered className="animate-pulse">
      <div className="flex justify-between">
        <div className="h-7 w-48 rounded bg-[var(--color-surface-2)]" />
        <div className="h-6 w-28 rounded-full bg-[var(--color-surface-2)]" />
      </div>
      <div className="mt-3 h-4 w-32 rounded bg-[var(--color-surface-2)]" />
      <div className="mt-4 flex gap-2">
        <div className="h-6 w-24 rounded-full bg-[var(--color-surface-2)]" />
        <div className="h-6 w-20 rounded-full bg-[var(--color-surface-2)]" />
      </div>
      <div className="mt-4 h-4 w-40 rounded bg-[var(--color-surface-2)]" />
      <div className="mt-4 h-4 w-24 rounded bg-[var(--color-surface-2)]" />
    </Card>
  );
}

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const q = searchParams.get('q') ?? '';
  const state = searchParams.get('state') ?? '';
  const tierParams = searchParams.getAll('tier');
  const offenseParams = searchParams.getAll('offense_type');
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));

  const tierSet = new Set(tierParams.map((t) => parseInt(t, 10) as RecordTier).filter((t) => t >= 1 && t <= 3));
  const offenseSet = new Set(offenseParams.filter((o): o is OffenseType => OFFENSE_OPTIONS.some((opt) => opt.value === o)));

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (q.trim()) params.set('q', q.trim());
    if (state) params.set('state', state);
    tierSet.forEach((t) => params.append('tier', String(t)));
    offenseSet.forEach((o) => params.append('offense_type', o));
    params.set('page', String(page));
    params.set('limit', String(PAGE_SIZE));

    const url = buildSearchUrl(params);
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(res.status === 500 ? 'Search failed' : `Search failed: ${res.status}`);
        return res.json();
      })
      .then((data: { results?: SearchResult[]; total?: number }) => {
        if (cancelled) return;
        setResults(Array.isArray(data.results) ? data.results : []);
        setTotal(typeof data.total === 'number' ? data.total : (data.results?.length ?? 0));
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Search failed');
          setResults([]);
          setTotal(0);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [q, state, tierParams.join(','), offenseParams.join(','), page]);

  function handleSearchSubmit(e: React.FormEvent) {
    e.preventDefault();
    const form = e.currentTarget as HTMLFormElement;
    const input = form.querySelector<HTMLInputElement>('input[name="q"]');
    const newQ = input?.value?.trim() ?? '';
    const next = new URLSearchParams(searchParams);
    if (newQ) next.set('q', newQ);
    else next.delete('q');
    next.delete('page');
    setSearchParams(next, { replace: true });
  }

  function updateFilter(key: 'state' | 'tier' | 'offense_type', value: string | string[]) {
    const next = new URLSearchParams(searchParams);
    next.delete('page');
    if (key === 'state') {
      if (value) next.set('state', value as string);
      else next.delete('state');
    } else if (key === 'tier') {
      next.delete('tier');
      (value as string[]).forEach((t) => next.append('tier', t));
    } else {
      next.delete('offense_type');
      (value as string[]).forEach((o) => next.append('offense_type', o));
    }
    setSearchParams(next, { replace: true });
  }

  function toggleTier(t: RecordTier) {
    const next = new Set(tierSet);
    if (next.has(t)) next.delete(t);
    else next.add(t);
    updateFilter('tier', Array.from(next).map(String));
  }

  function toggleOffense(o: OffenseType) {
    const next = new Set(offenseSet);
    if (next.has(o)) next.delete(o);
    else next.add(o);
    updateFilter('offense_type', Array.from(next));
  }

  const hasQuery = q.trim().length > 0;
  const resultCount = total ?? results.length;

  return (
    <div className="space-y-6">
      <form onSubmit={handleSearchSubmit} role="search" className="max-w-xl">
        <Input
          type="search"
          name="q"
          placeholder="Search by full name..."
          defaultValue={q}
          key={q}
          aria-label="Search by full name"
        />
        <button
          type="submit"
          className="mt-2 w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dispute)] sm:w-auto sm:px-6"
        >
          Search
        </button>
      </form>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:gap-6">
        <div className="flex flex-wrap items-center gap-4">
          <label className="text-sm font-medium text-[var(--color-text-secondary)]">
            State
          </label>
          <select
            value={state}
            onChange={(e) => updateFilter('state', e.target.value)}
            className="rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]"
          >
            <option value="">All states</option>
            {US_STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Tier</legend>
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Tier</span>
          {TIERS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={tierSet.has(value)}
                onChange={() => toggleTier(value)}
                className="rounded border-[var(--color-border)] text-[var(--color-dispute)] focus:ring-[var(--color-dispute)]"
              />
              {label}
            </label>
          ))}
        </fieldset>

        <fieldset className="flex flex-wrap gap-4">
          <legend className="sr-only">Offense type</legend>
          <span className="w-full text-sm font-medium text-[var(--color-text-secondary)] sm:w-auto">
            Offense type
          </span>
          {OFFENSE_OPTIONS.map(({ value, label }) => (
            <label key={value} className="flex items-center gap-2 text-sm text-[var(--color-text-primary)]">
              <input
                type="checkbox"
                checked={offenseSet.has(value)}
                onChange={() => toggleOffense(value)}
                className="rounded border-[var(--color-border)] text-[var(--color-dispute)] focus:ring-[var(--color-dispute)]"
              />
              {label}
            </label>
          ))}
        </fieldset>
      </div>

      {error && (
        <p className="text-sm text-[var(--color-accent)]" role="alert">
          {error}
        </p>
      )}

      {!error && (
        <>
          <p className="text-sm text-[var(--color-text-secondary)]">
            {loading
              ? 'Loading…'
              : hasQuery
                ? `${resultCount} record${resultCount === 1 ? '' : 's'} found for “${q}”`
                : resultCount === 0
                  ? 'Enter a name to search.'
                  : `${resultCount} record${resultCount === 1 ? '' : 's'} found.`}
          </p>

          {loading ? (
            <ul className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <li key={i}>
                  <RecordCardSkeleton />
                </li>
              ))}
            </ul>
          ) : results.length === 0 ? (
            <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-8 text-center">
              <p className="text-[var(--color-text-primary)]">
                No records found.
              </p>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                If you have information about this person, you can{' '}
                <a href="/submit" className="text-[var(--color-dispute)] underline hover:no-underline">
                  submit a report
                </a>
                .
              </p>
            </div>
          ) : (
            <ul className="space-y-4">
              {results.map((result) => (
                <li key={result.person.id}>
                  <RecordCard result={result} />
                </li>
              ))}
            </ul>
          )}

          {!loading && total !== null && total > PAGE_SIZE && (
            <nav className="flex flex-wrap items-center gap-2 pt-4" aria-label="Pagination">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(page - 1));
                  setSearchParams(next, { replace: true });
                }}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  page <= 1
                    ? 'cursor-not-allowed text-[var(--color-text-muted)]'
                    : 'text-[var(--color-dispute)] hover:underline',
                )}
              >
                Previous
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">
                Page {page} of {Math.ceil(total / PAGE_SIZE)}
              </span>
              <button
                type="button"
                disabled={page >= Math.ceil(total / PAGE_SIZE)}
                onClick={() => {
                  const next = new URLSearchParams(searchParams);
                  next.set('page', String(page + 1));
                  setSearchParams(next, { replace: true });
                }}
                className={cn(
                  'rounded px-3 py-1.5 text-sm font-medium transition-colors',
                  page >= Math.ceil(total / PAGE_SIZE)
                    ? 'cursor-not-allowed text-[var(--color-text-muted)]'
                    : 'text-[var(--color-dispute)] hover:underline',
                )}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
