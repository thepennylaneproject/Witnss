import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'info' | 'warning' | 'error';
export type AlertSurface = 'ledger' | 'placard';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
  surface?: AlertSurface;
}

type StyleSet = { box: string; title: string; icon: string; body: string };

const ledgerStyles: Record<AlertVariant, StyleSet> = {
  info: {
    box: 'border-l-4 border-[var(--color-dispute)] bg-[var(--color-dispute)]/[0.08]',
    title: 'text-[var(--color-dispute)]',
    icon: 'text-[var(--color-dispute)]',
    body: 'text-[var(--color-text-secondary)] [&_a]:text-[var(--color-dispute)] [&_a]:underline',
  },
  warning: {
    box: 'border-l-4 border-[var(--color-tier-2)] bg-[var(--color-tier-2)]/[0.08]',
    title: 'text-[var(--color-tier-2)]',
    icon: 'text-[var(--color-tier-2)]',
    body: 'text-[var(--color-text-secondary)] [&_a]:text-[var(--color-dispute)] [&_a]:underline',
  },
  error: {
    box: 'border-l-4 border-[var(--color-accent)] bg-[var(--color-accent)]/[0.08]',
    title: 'text-[var(--color-accent)]',
    icon: 'text-[var(--color-accent)]',
    body: 'text-[var(--color-text-secondary)] [&_a]:text-[var(--color-dispute)] [&_a]:underline',
  },
};

const placardStyles: Record<AlertVariant, StyleSet> = {
  info: {
    box: 'border-l-4 border-[var(--color-placard-accent)] bg-[var(--color-placard-ink)]/[0.06]',
    title: 'text-[var(--color-placard-ink)]',
    icon: 'text-[var(--color-placard-accent)]',
    body: 'text-[var(--color-placard-muted)] [&_a]:text-[var(--color-placard-accent)] [&_a]:underline',
  },
  warning: {
    box: 'border-l-4 border-[#b8860b] bg-[#b8860b]/10',
    title: 'text-[var(--color-placard-ink)]',
    icon: 'text-[#8a6608]',
    body: 'text-[var(--color-placard-muted)] [&_a]:text-[var(--color-placard-accent)] [&_a]:underline',
  },
  error: {
    box: 'border-l-4 border-[var(--color-placard-accent)] bg-[var(--color-placard-accent)]/10',
    title: 'text-[var(--color-placard-accent)]',
    icon: 'text-[var(--color-placard-accent)]',
    body: 'text-[var(--color-placard-muted)] [&_a]:text-[var(--color-placard-ink)] [&_a]:underline',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  surface = 'ledger',
  role = variant === 'error' ? 'alert' : 'status',
  ...props
}: AlertProps) {
  const table = surface === 'placard' ? placardStyles : ledgerStyles;
  const v = table[variant];
  return (
    <div
      role={role}
      className={cn(
        'rounded-none border border-transparent py-3 pl-3 pr-4 text-sm',
        v.box,
        className,
      )}
      {...props}
    >
      <div className="flex gap-3">
        <span className={cn('mt-0.5 shrink-0', v.icon)} aria-hidden>
          {variant === 'info' && <InfoIcon />}
          {variant === 'warning' && <WarningIcon />}
          {variant === 'error' && <ErrorIcon />}
        </span>
        <div className="min-w-0 flex-1">
          {title != null && title !== '' && (
            <p className={cn('mb-1 font-semibold', v.title)}>{title}</p>
          )}
          <div className={v.body}>{children}</div>
        </div>
      </div>
    </div>
  );
}

function InfoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
    </svg>
  );
}
