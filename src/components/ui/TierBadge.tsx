import type { RecordTier } from '../../lib/types';
import { cn } from '../../lib/utils';

const TIER_CONFIG: Record<
  RecordTier,
  { label: string; tooltip: string; dotClass: string }
> = {
  1: {
    label: 'Verified Record',
    tooltip:
      'Sourced from court conviction or final protective order',
    dotClass: 'bg-[var(--color-tier-1)]',
  },
  2: {
    label: 'Documented',
    tooltip:
      'Sourced from police report, arrest record, or civil filing',
    dotClass: 'bg-[var(--color-tier-2)]',
  },
  3: {
    label: 'Community Reported',
    tooltip:
      'Submitted by survivors. Unverified. Two or more independent submissions.',
    dotClass: 'bg-[var(--color-tier-3)]',
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
        'inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2.5 py-1 text-sm font-medium text-[var(--color-text-primary)]',
        className,
      )}
      title={cfg.tooltip}
    >
      <span
        className={cn('h-2 w-2 shrink-0 rounded-full', cfg.dotClass)}
        aria-hidden
      />
      <span>{cfg.label}</span>
    </span>
  );
}
