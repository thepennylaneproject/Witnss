import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export interface PlacardLeadProps extends HTMLAttributes<HTMLElement> {
  kicker?: ReactNode;
  innerClassName?: string;
  children: ReactNode;
}

export function PlacardLead({
  kicker,
  children,
  className,
  innerClassName,
  ...props
}: PlacardLeadProps) {
  return (
    <section
      className={cn(
        '-mx-4 border-y border-[var(--color-placard-rule)] border-l-2 border-l-[var(--color-placard-stripe)] bg-[var(--color-placard-bg)] px-4 py-8 sm:py-12',
        className,
      )}
      {...props}
    >
      <div className={cn('mx-auto max-w-3xl', innerClassName)}>
        {kicker && (
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-[var(--color-placard-muted)]">
            {kicker}
          </p>
        )}
        {children}
      </div>
    </section>
  );
}
