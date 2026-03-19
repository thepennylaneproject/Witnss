import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/utils';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ButtonSurface = 'ledger' | 'placard';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  surface?: ButtonSurface;
  children: ReactNode;
}

function variantClassesLedger(variant: ButtonVariant): string {
  const map: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] border border-transparent',
    secondary:
      'bg-[var(--color-surface-2)] text-[var(--color-text-primary)] border border-[var(--color-border)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-surface)]',
    ghost:
      'bg-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] border border-transparent',
    danger:
      'bg-transparent text-[var(--color-accent)] border border-[var(--color-accent)] hover:bg-[var(--color-accent)]/10',
  };
  return map[variant];
}

function variantClassesPlacard(variant: ButtonVariant): string {
  const map: Record<ButtonVariant, string> = {
    primary:
      'bg-[var(--color-placard-accent)] text-white hover:brightness-95 border border-[var(--color-placard-ink)]',
    secondary:
      'bg-[var(--color-placard-bg)] text-[var(--color-placard-ink)] border border-[var(--color-placard-rule)] hover:bg-[var(--color-placard-rule)]/30',
    ghost:
      'bg-transparent text-[var(--color-placard-muted)] hover:text-[var(--color-placard-ink)] border border-transparent',
    danger:
      'bg-transparent text-[var(--color-placard-accent)] border border-[var(--color-placard-accent)] hover:bg-[var(--color-placard-accent)]/10',
  };
  return map[variant];
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-2 text-sm rounded-none min-h-[2.25rem]',
  md: 'px-4 py-2 text-sm rounded-none min-h-[2.5rem]',
  lg: 'px-6 py-3 text-base rounded-none min-h-[3rem]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  surface = 'ledger',
  className,
  type = 'button',
  disabled,
  children,
  ...props
}: ButtonProps) {
  const v =
    surface === 'placard'
      ? variantClassesPlacard(variant)
      : variantClassesLedger(variant);

  const focusRing =
    surface === 'placard'
      ? 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-placard-accent)]'
      : 'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-dispute)]';

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium transition-colors disabled:pointer-events-none disabled:opacity-50',
        focusRing,
        v,
        sizeClasses[size],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
