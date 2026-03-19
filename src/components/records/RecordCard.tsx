import { Link } from 'react-router-dom';
import type { SearchResult, Record as RecordType } from '../../lib/types';
import { SOURCE_TYPE_LABELS } from '../../lib/types';
import { Card } from '../ui/Card';
import { TierBadge } from '../ui/TierBadge';
import { OffenseBadge } from '../ui/OffenseBadge';

function offenseYear(dateStr: string | null): string | null {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : String(d.getFullYear());
}

/** Primary tier for display (most verified = lowest number). */
function primaryTier(records: RecordType[]): 1 | 2 | 3 {
  const tiers = records.map((r) => r.tier);
  if (tiers.includes(1)) return 1;
  if (tiers.includes(2)) return 2;
  return 3;
}

/** Unique offense types across records. */
function uniqueOffenseTypes(records: RecordType[]): RecordType['offense_type'][] {
  const set = new Set(records.map((r) => r.offense_type));
  return Array.from(set);
}

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
    <Card padding="md" bordered className="relative">
      <div className="absolute right-4 top-4">
        <TierBadge tier={tier} />
      </div>

      <div className="pr-32">
        <h2
          className="text-2xl font-semibold text-[var(--color-text-primary)]"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          {person.full_name}
        </h2>
        <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
          {[person.state, person.county].filter(Boolean).join(' · ')}
        </p>
        {person.dob_approximate && (
          <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
            Approx. age: {person.dob_approximate}
          </p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {offenseTypes.map((offense) => (
          <OffenseBadge key={offense} offense={offense} />
        ))}
      </div>

      {records.length > 0 && (
        <div className="mt-3 space-y-1 text-sm text-[var(--color-text-secondary)]">
          {records.map((rec) => (
            <div key={rec.id} className="flex flex-wrap items-center gap-x-2">
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
            </div>
          ))}
        </div>
      )}

      {isTier3 && (
        <p className="mt-3 rounded border border-[var(--color-tier-3)]/40 bg-[var(--color-tier-3)]/10 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
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
            className="text-xs text-[var(--color-text-muted)] hover:underline"
          >
            Dispute this record
          </Link>
        </p>
      )}
    </Card>
  );
}
