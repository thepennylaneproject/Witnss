import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: CardPadding;
  bordered?: boolean;
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
  bordered = true,
  className,
  ...props
}: CardProps) {
  return (
    <div
      className={cn(
        'rounded-lg bg-[var(--color-surface)]',
        bordered && 'border border-[var(--color-border)]',
        paddingClasses[padding],
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
