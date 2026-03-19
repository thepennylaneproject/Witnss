import type { InputHTMLAttributes, ReactNode } from 'react';
import { forwardRef, useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: ReactNode;
  id?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  function Input(
    { label, error, helperText, id, className, disabled, ...props },
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

    return (
      <div className="flex w-full flex-col gap-1.5">
        {label != null && label !== '' && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-[var(--color-text-secondary)]"
          >
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
            'w-full rounded-md border bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] transition-colors',
            'border-[var(--color-border)] focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
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
          <p id={hintId} className="text-sm text-[var(--color-text-muted)]">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);
