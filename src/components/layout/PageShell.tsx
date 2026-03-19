import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const NAV = [
  { to: '/search', label: 'Search' },
  { to: '/submit', label: 'Submit a Record' },
  { to: '/dispute', label: 'Dispute a Record' },
  { to: '/about', label: 'About' },
  { to: '/support', label: 'Support' },
] as const;

export default function PageShell() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { pathname } = useLocation();

  return (
    <div className="flex min-h-screen flex-col bg-[var(--color-bg)]">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:gap-6 sm:py-5">
          <div className="flex items-start justify-between gap-4 sm:block">
            <div>
              <Link
                to="/"
                className="font-sign text-3xl tracking-tight text-[var(--color-text-primary)] sm:text-4xl"
                style={{ fontFamily: 'var(--font-sign)' }}
                onClick={() => setMenuOpen(false)}
              >
                Witnss
              </Link>
              <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
                Because someone was there.
              </p>
            </div>
            <button
              type="button"
              className="flex h-11 min-w-[2.75rem] shrink-0 items-center justify-center border border-[var(--color-border)] text-[var(--color-text-primary)] sm:hidden"
              aria-expanded={menuOpen}
              aria-controls="site-nav"
              onClick={() => setMenuOpen((o) => !o)}
            >
              <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
              {menuOpen ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
          <nav
            id="site-nav"
            className={cn(
              'flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8',
              !menuOpen && 'hidden sm:flex',
            )}
          >
            {NAV.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'py-2 text-sm font-medium transition-colors sm:py-1',
                  pathname === to || pathname.startsWith(`${to}/`)
                    ? 'text-[var(--color-text-primary)]'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]',
                )}
                onClick={() => setMenuOpen(false)}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:py-10">
        <Outlet />
      </main>

      <footer className="mt-auto border-t border-[var(--color-border)] bg-[var(--color-bg)] px-4 py-8">
        <div className="mx-auto max-w-6xl space-y-4">
          <p
            className="font-display text-lg italic leading-snug text-[var(--color-text-primary)]"
            style={{ fontFamily: 'var(--font-display)' }}
          >
            Documented. Public. Witnessed.
          </p>
          <p className="max-w-3xl text-sm leading-relaxed text-[var(--color-text-muted)]">
            Witnss displays public records and community-reported accounts. All Tier 3
            entries are user-submitted and unverified. This platform is not a law
            enforcement agency.
          </p>
          <p className="text-sm">
            <Link
              to="/support"
              className="font-medium text-[var(--color-dispute)] underline underline-offset-2 hover:text-[var(--color-dispute)]/90"
            >
              Support Witnss
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
