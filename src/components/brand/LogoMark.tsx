import { cn } from '../../lib/utils';

const src = {
  'on-dark': '/brand/witnss-eye-on-dark.png',
  'on-light': '/brand/witnss-eye-on-light.png',
} as const;

const sizeClass = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-[4.5rem] w-[4.5rem] sm:h-24 sm:w-24',
} as const;

export type LogoMarkProps = {
  variant: keyof typeof src;
  size?: keyof typeof sizeClass;
  className?: string;
  /** When true, hide from assistive tech (adjacent text already names the brand). */
  decorative?: boolean;
};

export function LogoMark({
  variant,
  size = 'md',
  className,
  decorative = false,
}: LogoMarkProps) {
  return (
    <img
      src={src[variant]}
      alt={decorative ? '' : 'Witnss'}
      width={512}
      height={512}
      decoding="async"
      draggable={false}
      className={cn('pointer-events-none select-none object-contain', sizeClass[size], className)}
      aria-hidden={decorative ? true : undefined}
    />
  );
}
