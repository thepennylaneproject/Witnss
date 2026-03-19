import type { OffenseType } from '../../lib/types';
import { cn } from '../../lib/utils';

const OFFENSE_LABELS: Record<OffenseType, string> = {
  domestic_assault: 'Domestic Assault',
  domestic_battery: 'Domestic Battery',
  strangulation: 'Strangulation',
  stalking: 'Stalking',
  harassment: 'Harassment',
  sexual_assault: 'Sexual Assault',
  child_endangerment: 'Child Endangerment',
  violation_of_protective_order: 'Violation of Protective Order',
  other: 'Other',
};

export interface OffenseBadgeProps {
  offense: OffenseType;
  className?: string;
}

export function OffenseBadge({ offense, className }: OffenseBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-0.5 font-mono text-xs font-medium uppercase tracking-wide text-[var(--color-text-secondary)]',
        className,
      )}
    >
      {OFFENSE_LABELS[offense] ?? offense}
    </span>
  );
}
