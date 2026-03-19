import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export type InputSurface = 'ledger' | 'placard';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: ReactNode;
  id?: string;
  surface?: InputSurface;
}

const surfaceClasses: Record<InputSurface, { label: string; input: string }> = {
  ledger: {
    label: 'text-sm font-medium text-[var(--color-text-secondary)]',
    input: cn(
      'border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)]',
      'focus:border-[var(--color-border-strong)] focus:ring-[var(--color-dispute)]',
    ),
  },
  placard: {
    label: 'text-sm font-medium text-[var(--color-placard-muted)]',
    input: cn(
      'border-[var(--color-placard-rule)] bg-[var(--color-placard-bg)] text-[var(--color-placard-ink)] placeholder:text-[var(--color-placard-muted)]',
      'focus:border-[var(--color-placard-ink)] focus:ring-[var(--color-placard-accent)]',
    ),
  },
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, helperText, id, className, disabled, surface = 'ledger', ...props },
    ref,
  ) {
    const uid = useId();
    const inputId = id ?? (props.name ? String(props.name) : `input-${uid}`);
    const errorId = `${inputId}-error`;
    const hintId = `${inputId}-hint`;
    const describedBy =
      [error ? errorId : null, helperText && !error ? hintId : null]
        .filter(Boolean)
        .join(' ') || undefined;

    const s = surfaceClasses[surface];

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label != null && label !== '' && (
          <label htmlFor={inputId} className={s.label}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className={cn(
            'w-full rounded-none border px-3 py-2 transition-colors focus:outline-none focus:ring-1',
            s.input,
            error &&
              'border-[var(--color-accent)] focus:ring-[var(--color-accent)]',
            disabled && 'cursor-not-allowed opacity-60',
            className,
          )}
          {...props}
        />
        {error != null && error !== '' && (
          <p id={errorId} className="text-sm text-[var(--color-accent)]" role="alert">
            {error}
          </p>
        )}
        {helperText != null && !error && (
          <p
            id={hintId}
            className={cn(
              'text-sm',
              surface === 'placard'
                ? 'text-[var(--color-placard-muted)]'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
