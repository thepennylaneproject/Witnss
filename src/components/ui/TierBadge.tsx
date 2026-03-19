import type { RecordTier } from '../../lib/types';
import { cn } from '../../lib/utils';

const TIER_CONFIG: Record<
  RecordTier,
  { code: string; label: string; tooltip: string; stripe: string }
> = {
  1: {
    code: 'T1',
    label: 'Verified',
    tooltip: 'Sourced from court conviction or final protective order',
    stripe: 'border-l-4 border-l-[var(--color-tier-1)]',
  },
  2: {
    code: 'T2',
    label: 'Documented',
    tooltip: 'Sourced from police report, arrest record, or civil filing',
    stripe: 'border-l-4 border-l-[var(--color-tier-2)]',
  },
  3: {
    code: 'T3',
    label: 'Community reported',
    tooltip: 'Submitted by survivors. Unverified. Two or more independent submissions.',
    stripe: 'border-l-4 border-l-[var(--color-tier-3)]',
  },
};

export interface TierBadgeProps {
  tier: RecordTier;
  className?: string;
}

export function TierBadge({ tier, className }: TierBadgeProps) {
  const cfg = TIER_CONFIG[tier];
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 border-y border-r border-[var(--color-border)] bg-[var(--color-surface-2)] py-1 pl-2 pr-2.5 font-mono text-[var(--color-text-primary)]',
        cfg.stripe,
        className,
      )}
      title={cfg.tooltip}
    >
      <span className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]">
        {cfg.code}
      </span>
      <span className="text-sm font-medium font-sans normal-case tracking-normal">
        {cfg.label}
      </span>
    </span>
  );
}
