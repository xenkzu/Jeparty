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
        display: ['"Kode Mono"', 'var(--font-display)', 'monospace'],
        body: ['"DM Mono"', 'var(--font-body)', 'monospace'],
        mono: ['"Kode Mono"', 'var(--font-mono)', 'monospace'],
        zalando: ['"Kode Mono"', 'var(--font-zalando)', 'monospace'],
        turret: ['"Kode Mono"', 'var(--font-turret)', 'monospace'],
        circuit: ['"Kode Mono"', 'var(--font-circuit)', 'monospace'],
        elons: ['"Kode Mono"', 'var(--font-elons)', 'monospace'],
        warcorp: ['"Kode Mono"', 'var(--font-warcorp)', 'monospace'],
        kode: ['"Kode Mono"', 'var(--font-kode)', 'monospace'],
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
      },
      keyframes: {
        'glitch-1': {
          '0%, 100%': { clipPath: 'inset(0 0 98% 0)', transform: 'translate(-2px, 0)' },
          '20%': { clipPath: 'inset(20% 0 60% 0)', transform: 'translate(2px, 0)' },
          '40%': { clipPath: 'inset(50% 0 30% 0)', transform: 'translate(-1px, 0)' },
          '60%': { clipPath: 'inset(80% 0 5% 0)', transform: 'translate(3px, 0)' },
          '80%': { clipPath: 'inset(10% 0 85% 0)', transform: 'translate(-2px, 0)' },
        },
        'glitch-2': {
          '0%, 100%': { clipPath: 'inset(98% 0 0 0)', transform: 'translate(2px, 0)', opacity: '0.8' },
          '20%': { clipPath: 'inset(60% 0 20% 0)', transform: 'translate(-2px, 0)' },
          '40%': { clipPath: 'inset(30% 0 50% 0)', transform: 'translate(1px, 0)' },
          '60%': { clipPath: 'inset(5% 0 80% 0)', transform: 'translate(-3px, 0)' },
          '80%': { clipPath: 'inset(85% 0 10% 0)', transform: 'translate(2px, 0)' },
        },
        'scanline': {
          '0%': { backgroundPosition: '0 0' },
          '100%': { backgroundPosition: '0 100vh' },
        },
        'crt-flicker': {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.85' },
          '94%': { opacity: '1' },
          '96%': { opacity: '0.9' },
          '97%': { opacity: '1' },
        },
        'rgb-split': {
          '0%, 100%': { textShadow: '2px 0 var(--color-tertiary-container), -2px 0 var(--color-primary)' },
          '50%': { textShadow: '-2px 0 var(--color-tertiary-container), 2px 0 var(--color-primary)' },
        },
        'border-pulse': {
          '0%, 100%': { borderColor: 'var(--color-tertiary-container)' },
          '50%': { borderColor: 'var(--color-primary)' },
        },
        'slide-in-left': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'slide-in-up': {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'score-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)', color: 'var(--color-tertiary-container)' },
          '100%': { transform: 'scale(1)' },
        },
        'btn-press': {
          '0%, 100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(2px, 2px)' },
        },
      },
      animation: {
        'glitch-1': 'glitch-1 0.3s steps(1) infinite',
        'glitch-2': 'glitch-2 0.3s steps(1) infinite',
        'crt-flicker': 'crt-flicker 8s infinite',
        'rgb-split': 'rgb-split 3s ease-in-out infinite',
        'border-pulse': 'border-pulse 2s ease-in-out infinite',
        'slide-in-left': 'slide-in-left 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-right': 'slide-in-right 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'slide-in-up': 'slide-in-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'fade-in': 'fade-in 0.3s ease forwards',
        'score-pop': 'score-pop 0.4s ease',
        'btn-press': 'btn-press 0.15s ease',
      },
    },
  },
  plugins: [],
}

