/**
 * Formatting and validation helpers (scaffold).
 */

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function formatApproximateDob(value: string | null): string {
  if (value == null || value.trim() === '') return '—';
  return value.trim();
}

export function isValidUSStateAbbr(code: string): boolean {
  return /^[A-Za-z]{2}$/.test(code.trim());
}
