import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '../components/ui/Input';
import { Alert } from '../components/ui/Alert';

const HOW_IT_WORKS = [
  {
    title: 'Tier 1 — Verified',
    description:
      'Records from court convictions or final protective orders. Independently verified.',
  },
  {
    title: 'Tier 2 — Documented',
    description:
      'Records from police reports, arrest records, or civil filings. Documented but not court-adjudicated.',
  },
  {
    title: 'Tier 3 — Community reported',
    description:
      'Submitted by survivors. Unverified. Two or more independent submissions may elevate for review.',
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
    <div className="mx-auto flex max-w-3xl flex-col items-center space-y-10 pb-16">
      <div className="flex flex-col items-center space-y-4 text-center">
        <h1
          className="text-5xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-6xl"
          style={{ fontFamily: 'var(--font-display)' }}
        >
          Witnss
        </h1>
        <p
          className="text-xl text-[var(--color-text-secondary)]"
          style={{ fontFamily: 'var(--font-body)' }}
        >
          Because someone was there.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xl space-y-4"
        role="search"
      >
        <Input
          type="search"
          name="q"
          label="Search by name"
          placeholder="Enter a full name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          aria-label="Search by full name"
        />
        <button
          type="submit"
          className="w-full rounded-lg bg-[var(--color-accent)] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dispute)]"
        >
          Search records
        </button>
      </form>

      <div className="w-full max-w-xl">
        <Alert variant="info" className="!py-2 text-xs">
          Witnss displays public records and community-reported accounts. Tier 3
          entries are user-submitted and unverified. This platform is not a law
          enforcement agency.
        </Alert>
      </div>

      <section
        className="grid w-full gap-8 pt-8 sm:grid-cols-3"
        aria-label="How it works"
      >
        {HOW_IT_WORKS.map((item) => (
          <div
            key={item.title}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <h2
              className="mb-2 text-lg font-semibold text-[var(--color-text-primary)]"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              {item.title}
            </h2>
            <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {item.description}
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
