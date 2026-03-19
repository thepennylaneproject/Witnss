import { Link } from 'react-router-dom';
import { Alert } from '../components/ui/Alert';
import { cn } from '../lib/utils';

const linkButtonClass =
  'inline-flex w-full items-center justify-center rounded-lg bg-[var(--color-accent)] px-4 py-3 text-base font-medium text-white transition-colors hover:bg-[var(--color-accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dispute)]';

const linkButtonSecondaryClass =
  'inline-flex w-full items-center justify-center rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-4 py-3 text-base font-medium text-[var(--color-text-primary)] transition-colors hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface-2)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dispute)]';

export default function Support() {
  const stripeOnce = import.meta.env.VITE_STRIPE_DONATION_URL?.trim() ?? '';
  const stripeMonthly = import.meta.env.VITE_STRIPE_DONATION_MONTHLY_URL?.trim() ?? '';
  const venmoRaw = import.meta.env.VITE_VENMO_USERNAME?.trim() ?? '';
  const venmoSlug = venmoRaw.replace(/^@/, '');
  const venmoLabel =
    venmoSlug === '' ? '' : venmoRaw.startsWith('@') ? venmoRaw : `@${venmoSlug}`;
  const venmoUrl =
    venmoSlug === '' ? '' : `https://venmo.com/${encodeURIComponent(venmoSlug)}`;

  const hasStripe = stripeOnce !== '' || stripeMonthly !== '';
  const hasVenmo = venmoUrl !== '';
  const hasAny = hasStripe || hasVenmo;

  return (
    <article className="mx-auto max-w-2xl space-y-10 pb-16">
      <header className="space-y-4">
        <h1
          className="font-sign text-5xl tracking-tight text-[var(--color-text-primary)] sm:text-6xl"
          style={{ fontFamily: 'var(--font-sign)' }}
        >
          Support Witnss
        </h1>
        <p className="text-lg leading-relaxed text-[var(--color-text-secondary)]">
          Help keep hosting, safety review, and the platform running. Witnss does not run
          ads or sell data—contributions go straight to operations.
        </p>
      </header>

      {!hasAny && (
        <Alert variant="info">
          Donation links are not configured in this environment. For other ways to reach us,{' '}
          <Link to="/about#contact">see About</Link>.
        </Alert>
      )}

      {hasStripe && (
        <section className="space-y-4" aria-label="Donate with Stripe">
          <h2
            className="font-sign text-2xl tracking-tight text-[var(--color-text-primary)] sm:text-3xl"
            style={{ fontFamily: 'var(--font-sign)' }}
          >
            Stripe
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Secure card payments through Stripe. Use monthly for recurring support; you can
            manage or cancel from Stripe&apos;s customer portal when enabled on the account.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            {stripeOnce !== '' && (
              <a
                href={stripeOnce}
                className={cn(linkButtonClass, 'sm:flex-1')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Give once
              </a>
            )}
            {stripeMonthly !== '' && (
              <a
                href={stripeMonthly}
                className={cn(linkButtonSecondaryClass, 'sm:flex-1')}
                target="_blank"
                rel="noopener noreferrer"
              >
                Give monthly
              </a>
            )}
          </div>
        </section>
      )}

      {hasVenmo && (
        <section className="space-y-4" aria-label="Venmo">
          <h2
            className="font-sign text-2xl tracking-tight text-[var(--color-text-primary)] sm:text-3xl"
            style={{ fontFamily: 'var(--font-sign)' }}
          >
            Venmo
          </h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Venmo works well for one-time tips. For recurring support, use{' '}
            {stripeMonthly !== '' ? (
              <span>Stripe &ldquo;Give monthly&rdquo; above.</span>
            ) : (
              <span>Stripe when monthly checkout is available.</span>
            )}
          </p>
          <p className="text-[var(--color-text-primary)]">
            <span className="font-medium">{venmoLabel}</span>
          </p>
          <a
            href={venmoUrl}
            className={linkButtonSecondaryClass}
            target="_blank"
            rel="noopener noreferrer"
          >
            Open in Venmo
          </a>
        </section>
      )}
    </article>
  );
}
