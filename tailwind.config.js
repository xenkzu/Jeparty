/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--color-background)',
        'on-background': 'var(--color-on-background)',
        surface: 'var(--color-surface)',
        'on-surface': 'var(--color-on-surface)',
        'surface-bright': 'var(--color-surface-bright)',
        'surface-dim': 'var(--color-surface-dim)',
        'surface-variant': 'var(--color-surface-variant)',
        'on-surface-variant': 'var(--color-on-surface-variant)',
        'surface-container-lowest': 'var(--color-surface-container-lowest)',
        'surface-container-low': 'var(--color-surface-container-low)',
        'surface-container': 'var(--color-surface-container)',
        'surface-container-high': 'var(--color-surface-container-high)',
        'surface-container-highest': 'var(--color-surface-container-highest)',
        
        primary: {
          DEFAULT: 'var(--color-primary)',
          container: 'var(--color-primary-container)',
          dim: 'var(--color-primary-dim)',
        },
        'on-primary': {
          DEFAULT: 'var(--color-on-primary)',
          container: 'var(--color-on-primary-container)',
        },
        
        secondary: {
          DEFAULT: 'var(--color-secondary)',
          container: 'var(--color-secondary-container)',
        },
        'on-secondary': {
          DEFAULT: 'var(--color-on-secondary)',
          container: 'var(--color-on-secondary-container)',
        },
        
        tertiary: {
          DEFAULT: 'var(--color-tertiary)',
          container: 'var(--color-tertiary-container)',
        },
        'on-tertiary': {
          DEFAULT: 'var(--color-on-tertiary)',
          container: 'var(--color-on-tertiary-container)',
        },
        
        error: {
          DEFAULT: 'var(--color-error)',
          container: 'var(--color-error-container)',
        },
        'on-error': {
          DEFAULT: 'var(--color-on-error)',
          container: 'var(--color-on-error-container)',
        },
        
        outline: {
          DEFAULT: 'var(--color-outline)',
          variant: 'var(--color-outline-variant)',
        },
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
      },
      boxShadow: {
        'ambient': 'var(--shadow-ambient)',
        'hard': '4px 4px 0 0 var(--tw-shadow-color)',
      },
      borderRadius: {
        'none': 'var(--border-radius-none)',
      },
      spacing: {
        'unit': 'var(--spacing-unit)',
      }
    },
  },
  plugins: [],
}

