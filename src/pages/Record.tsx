import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import type { Record as RecordType, Person, RecordStatus } from '../lib/types';
import { SOURCE_TYPE_LABELS } from '../lib/types';
import { Alert, Card } from '../components/ui';
import { TierBadge } from '../components/ui/TierBadge';
import { OffenseBadge } from '../components/ui/OffenseBadge';

const DISPUTE_BANNER_MESSAGE =
  'A dispute has been filed for this record and is currently under review.';

function showDisputeBanner(status: RecordStatus): boolean {
  return status === 'disputed' || status === 'under_review';
}

export default function RecordPage() {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<RecordType | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/.netlify/functions/record?id=${encodeURIComponent(id)}`);
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.status === 404) {
          setNotFound(true);
          setRecord(null);
          setPerson(null);
          return;
        }
        if (!res.ok) {
          setNotFound(true);
          return;
        }
        setRecord(data.record as RecordType);
        setPerson(data.person as Person);
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-2xl py-8 text-center text-[var(--color-text-secondary)]">
        Loading…
      </div>
    );
  }

  if (notFound || !record || !person) {
    return (
      <div className="mx-auto max-w-2xl space-y-6">
        <h1 className="font-display text-2xl font-bold text-[var(--color-text-primary)]">
          Record not found
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          This record may have been removed or the link may be incorrect.
        </p>
        <Link
          to="/search"
          className="text-[var(--color-dispute)] underline hover:no-underline"
        >
          Search records
        </Link>
      </div>
    );
  }

  const sourceLabel = SOURCE_TYPE_LABELS[record.source_type as keyof typeof SOURCE_TYPE_LABELS]
    ?? record.source_type;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {showDisputeBanner(record.status) && (
        <Alert variant="warning" title="Dispute pending">
          {DISPUTE_BANNER_MESSAGE}
        </Alert>
      )}

      <Card padding="lg" bordered className="relative">
        <div className="absolute right-6 top-6">
          <TierBadge tier={record.tier} />
        </div>
        <div className="pr-28">
          <h1
            className="text-2xl font-semibold text-[var(--color-text-primary)] sm:text-3xl"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            {person.full_name}
          </h1>
          <p className="mt-1 text-[var(--color-text-secondary)]">
            {[person.state, person.county].filter(Boolean).join(' · ')}
          </p>
          {person.dob_approximate && (
            <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">
              Approx. age: {person.dob_approximate}
            </p>
          )}
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <OffenseBadge offense={record.offense_type} />
        </div>

        <dl className="mt-4 space-y-2 text-sm">
          <div>
            <dt className="font-medium text-[var(--color-text-secondary)]">Source</dt>
            <dd className="text-[var(--color-text-primary)]">{sourceLabel}</dd>
          </div>
          {record.offense_date && (
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Date</dt>
              <dd className="text-[var(--color-text-primary)]">{record.offense_date}</dd>
            </div>
          )}
          <div>
            <dt className="font-medium text-[var(--color-text-secondary)]">Jurisdiction</dt>
            <dd className="text-[var(--color-text-primary)]">
              {[record.jurisdiction_state, record.jurisdiction_county].filter(Boolean).join(', ') || '—'}
            </dd>
          </div>
          {record.source_reference && (
            <div>
              <dt className="font-medium text-[var(--color-text-secondary)]">Case / reference</dt>
              <dd className="text-[var(--color-text-primary)]">{record.source_reference}</dd>
            </div>
          )}
        </dl>

        {record.tier === 3 && (
          <p className="mt-4 rounded border border-[var(--color-tier-3)]/40 bg-[var(--color-tier-3)]/10 px-3 py-2 text-xs text-[var(--color-text-secondary)]">
            This record was submitted by community members and has not been independently verified.
          </p>
        )}

        <div className="mt-6 border-t border-[var(--color-border)] pt-4">
          <Link
            to={`/dispute?recordId=${record.id}`}
            className="text-sm font-medium text-[var(--color-dispute)] underline hover:no-underline"
          >
            Dispute this record
          </Link>
        </div>
      </Card>
    </div>
  );
}
