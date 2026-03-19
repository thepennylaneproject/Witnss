import { cn } from '../../lib/utils';

export interface SpinnerProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

const sizePx = { sm: 20, md: 28, lg: 40 };

export function Spinner({
  className,
  size = 'md',
  label = 'Loading',
}: SpinnerProps) {
  const px = sizePx[size];
  return (
    <span
      className={cn('inline-flex items-center justify-center', className)}
      role="status"
      aria-label={label}
    >
      <svg
        width={px}
        height={px}
        viewBox="0 0 24 24"
        fill="none"
        className="animate-spin text-[var(--color-text-secondary)]"
        aria-hidden
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-90"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </span>
  );
}
