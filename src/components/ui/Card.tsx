import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';
export type CardVariant = 'ledger' | 'placard' | 'sheet';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
  /** Ignored when variant is `placard` or `sheet` (those define their own edges). */
  bordered?: boolean;
  variant?: CardVariant;
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-5',
  lg: 'p-8',
};

export function Card({
  children,
  padding = 'md',
  bordered = false,
  variant = 'ledger',
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-none',
        variant === 'ledger' &&
          !bordered &&
          'bg-transparent',
        variant === 'ledger' &&
          bordered &&
          'border border-[var(--color-border)] bg-[var(--color-bg)]',
        variant === 'sheet' &&
          'border border-[var(--color-border)] bg-[var(--color-surface)]',
        variant === 'placard' &&
          'border-y border-[var(--color-placard-rule)] border-l-4 border-l-[var(--color-placard-accent)] bg-[var(--color-placard-bg)] text-[var(--color-placard-ink)]',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
