import { Link } from 'react-router-dom';
import type { SearchResult, Record as RecordType } from '../../lib/types';
import { SOURCE_TYPE_LABELS } from '../../lib/types';
import { TierBadge } from '../ui/TierBadge';
import { OffenseBadge } from '../ui/OffenseBadge';
import { cn } from '../../lib/utils';

function offenseYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : String(d.getFullYear());
}

function primaryTier(records: RecordType[]): 1 | 2 | 3 {
  const tiers = records.map((r) => r.tier);
  if (tiers.includes(1)) return 1;
  if (tiers.includes(2)) return 2;
  return 3;
}

function uniqueOffenseTypes(records: RecordType[]): RecordType['offense_type'][] {
  const set = new Set(records.map((r) => r.offense_type));
  return Array.from(set);
}

const tierStripe: Record<1 | 2 | 3, string> = {
  1: 'border-l-[var(--color-tier-1)]',
  2: 'border-l-[var(--color-tier-2)]',
  3: 'border-l-[var(--color-tier-3)]',
};

export interface RecordCardProps {
  result: SearchResult;
}

export function RecordCard({ result }: RecordCardProps) {
  const { person, records } = result;
  const firstRecord = records[0];
  const tier = primaryTier(records);
  const offenseTypes = uniqueOffenseTypes(records);
  const isTier3 = tier === 3;

  return (
    <article
      className={cn('py-6 pl-4', tierStripe[tier], 'border-l-4')}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2
            className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
            style={{ fontFamily: 'var(--font-sign)' }}
          >
            {person.full_name}
          </h2>
          <p className="mt-1 font-mono text-sm text-[var(--color-text-secondary)]">
            {[person.state, person.county].filter(Boolean).join(' · ') || '—'}
          </p>
          {person.dob_approximate && (
            <p className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
              Approx. age: {person.dob_approximate}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <TierBadge tier={tier} />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {offenseTypes.map((offense) => (
          <OffenseBadge key={offense} offense={offense} />
        ))}
      </div>

      {records.length > 0 && (
        <ul className="mt-3 space-y-1 font-mono text-sm text-[var(--color-text-secondary)]">
          {records.map((rec) => (
            <li key={rec.id} className="flex flex-wrap items-center gap-x-2">
              {rec.offense_date && (
                <span>
                  {rec.tier === 3
                    ? offenseYear(rec.offense_date)
                    : rec.offense_date}
                </span>
              )}
              <span>
                {SOURCE_TYPE_LABELS[rec.source_type as keyof typeof SOURCE_TYPE_LABELS] ??
                  rec.source_type}
              </span>
            </li>
          ))}
        </ul>
      )}

      {isTier3 && (
        <p className="mt-3 border-l-4 border-[var(--color-tier-3)]/60 bg-[var(--color-tier-3)]/[0.06] py-2 pl-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
          This record was submitted by community members and has not been
          independently verified.
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-center gap-4">
        {firstRecord && (
          <Link
            to={`/record/${firstRecord.id}`}
            className="text-sm font-medium text-[var(--color-dispute)] underline hover:no-underline"
          >
            View full record
          </Link>
        )}
      </div>

      {firstRecord && (
        <p className="mt-2">
          <Link
            to={`/dispute?recordId=${firstRecord.id}`}
            className="font-mono text-xs text-[var(--color-text-muted)] hover:underline"
          >
            Dispute this record
          </Link>
        </p>
      )}
    </article>
  );
}
