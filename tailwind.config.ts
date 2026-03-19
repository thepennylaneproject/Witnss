import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        witnss: {
          bg: 'var(--color-bg)',
          surface: 'var(--color-surface)',
          'surface-2': 'var(--color-surface-2)',
          border: 'var(--color-border)',
          'border-strong': 'var(--color-border-strong)',
          'ledger-muted': 'var(--color-ledger-muted)',
          ink: 'var(--color-text-primary)',
          muted: 'var(--color-text-secondary)',
          'text-muted': 'var(--color-text-muted)',
          accent: 'var(--color-accent)',
          'accent-hover': 'var(--color-accent-hover)',
          dispute: 'var(--color-dispute)',
          tier1: 'var(--color-tier-1)',
          tier2: 'var(--color-tier-2)',
          tier3: 'var(--color-tier-3)',
          placard: {
            bg: 'var(--color-placard-bg)',
            ink: 'var(--color-placard-ink)',
            rule: 'var(--color-placard-rule)',
            muted: 'var(--color-placard-muted)',
            accent: 'var(--color-placard-accent)',
          },
        },
      },
      fontFamily: {
        sign: ['var(--font-sign)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        ui: 'var(--radius-ui)',
      },
    },
  },
  plugins: [],
} satisfies Config;
