import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { PlacardLead } from '../components/layout/PlacardLead';
import { LogoMark } from '../components/brand/LogoMark';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';
import { Button } from '../components/ui/Button';

const HOW_IT_WORKS = [
  {
    code: 'T1',
    title: 'Tier 1 — Verified',
    description:
      'Records from court convictions or final protective orders. Independently verified.',
  },
  {
    code: 'T2',
    title: 'Tier 2 — Documented',
    description:
      'Records from police reports, arrest records, or civil filings. Documented but not court-adjudicated.',
  },
  {
    code: 'T3',
    title: 'Tier 3 — Community reported',
    description:
      'Shared by survivors and others who witnessed harm. We don’t verify each one alone. When separate accounts align, we may review with care.',
  },
];

export default function Home() {
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
    } else {
      navigate('/search');
    }
  }

  return (
    <div className="pb-16">
      <PlacardLead
        className="mb-12"
        kicker="Public index · Name search"
        aria-label="Search Witnss"
      >
        <div className="mt-4 flex flex-col gap-6 sm:flex-row sm:items-start sm:gap-10">
          <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-start sm:gap-8">
            <LogoMark
              variant="on-light"
              size="lg"
              decorative
              className="shrink-0 sm:mt-1"
            />
            <div className="min-w-0">
              <h1
                className="font-sign text-7xl leading-none tracking-tight text-[var(--color-placard-ink)] sm:text-8xl"
                style={{ fontFamily: 'var(--font-sign)' }}
              >
                Witnss
              </h1>
              <p className="mt-3 max-w-md text-lg leading-snug text-[var(--color-placard-muted)]">
                Because someone was there.
              </p>
            </div>
          </div>
          <div
            className="hidden w-px shrink-0 self-stretch bg-[var(--color-placard-rule)] sm:block"
            aria-hidden
          />
        </div>

        <form
          onSubmit={handleSubmit}
          className="mt-10 max-w-xl space-y-4 border-t-2 border-double border-[var(--color-placard-rule)] pt-8"
          role="search"
        >
          <Input
            type="search"
            name="q"
            label="Search by name"
            placeholder="Enter a full name…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            surface="placard"
            autoFocus
            aria-label="Search by full name"
          />
          <Button type="submit" surface="placard" size="lg" className="w-full sm:w-auto">
            Search records
          </Button>
        </form>

        <div className="mt-8">
          <Alert variant="info" surface="placard" className="text-xs sm:text-sm">
            Witnss brings together public records and community-shared accounts. Tier 3 entries
            come from people, not courts—we label them clearly. We’re not law enforcement; we’re a
            place to see what’s already been said in public and in community.
          </Alert>
        </div>
      </PlacardLead>

      <div className="mx-auto max-w-3xl">
        <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-[var(--color-text-secondary)]">
          How tiers work
        </h2>
        <ul
          className="mt-4 divide-y divide-[var(--color-border)] border-t border-[var(--color-border)]"
          aria-label="How it works"
        >
          {HOW_IT_WORKS.map((item) => (
            <li key={item.title} className="flex gap-4 py-5 sm:gap-8">
              <span className="w-10 shrink-0 font-mono text-sm font-medium text-[var(--color-text-muted)]">
                {item.code}
              </span>
              <div className="min-w-0">
                <h3 className="font-sign text-xl tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                  {item.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">
                  {item.description}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
