import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type AlertVariant = 'info' | 'warning' | 'error';

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: AlertVariant;
  title?: string;
  children: ReactNode;
}

const variantStyles: Record<
  AlertVariant,
  { box: string; title: string; icon: string }
> = {
  info: {
    box: 'border-[var(--color-dispute)]/40 bg-[var(--color-dispute)]/10',
    title: 'text-[var(--color-dispute)]',
    icon: 'text-[var(--color-dispute)]',
  },
  warning: {
    box: 'border-[var(--color-tier-2)]/40 bg-[var(--color-tier-2)]/10',
    title: 'text-[var(--color-tier-2)]',
    icon: 'text-[var(--color-tier-2)]',
  },
  error: {
    box: 'border-[var(--color-accent)]/40 bg-[var(--color-accent)]/10',
    title: 'text-[var(--color-accent)]',
    icon: 'text-[var(--color-accent)]',
  },
};

export function Alert({
  variant = 'info',
  title,
  children,
  className,
  role = variant === 'error' ? 'alert' : 'status',
  ...props
}: AlertProps) {
  const v = variantStyles[variant];
  return (
    <div
      role={role}
      className={cn(
        'rounded-lg border px-4 py-3 text-sm text-[var(--color-text-primary)]',
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
          <div className="text-[var(--color-text-secondary)] [&_a]:text-[var(--color-dispute)] [&_a]:underline">
            {children}
          </div>
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
