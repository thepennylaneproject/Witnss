import { cn } from './utils';

/** Shared classes for native selects, textareas, and file inputs on the night ledger. */
export const ledgerFieldClass = cn(
  'w-full rounded-none border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] transition-colors',
  'placeholder:text-[var(--color-text-muted)]',
  'focus:border-[var(--color-border-strong)] focus:outline-none focus:ring-1 focus:ring-[var(--color-dispute)]',
);

export const ledgerFieldErrorClass =
  'border-[var(--color-feedback)] focus:ring-[var(--color-feedback)]';

export const ledgerCheckboxClass =
  'h-4 w-4 shrink-0 rounded-none border border-[var(--color-border)] text-[var(--color-dispute)] focus:ring-1 focus:ring-[var(--color-dispute)]';

export const ledgerFileInputClass =
  'block w-full text-sm text-[var(--color-text-secondary)] file:mr-4 file:rounded-none file:border file:border-[var(--color-border)] file:bg-[var(--color-surface-2)] file:px-3 file:py-2 file:text-sm file:font-medium file:text-[var(--color-text-primary)]';
