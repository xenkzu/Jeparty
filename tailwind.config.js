/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        surface: '#270000',
        'surface-container-lowest': '#000000',
        'surface-container-low': '#380000',
        'surface-container-high': '#490000',
        'surface-container-highest': '#5A0000',
        'surface-bright': '#600000',
        tertiary: '#FF725E',
        'tertiary-container': '#FE0000',
        'on-tertiary-container': '#000000',
        primary: '#FFFFFF',
        'on-surface': '#FFFFFF',
        'outline-variant': '#950100',
        error: '#FF6E84',
      },
      fontFamily: {
        display: ['Archivo Black', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['3.5rem', { lineHeight: '1', letterSpacing: '-0.05em' }],
        'label-sm': ['0.875rem', { letterSpacing: '0.1em' }],
      },
      boxShadow: {
        'ambient': '0 0 64px rgba(255, 255, 255, 0.08)',
        'hard': '4px 4px 0 0 var(--tw-shadow-color)',
      },
      spacing: {
        '8': '1.75rem',
        '24': '5.5rem',
      },
      backgroundImage: {
        'gradient-lithographic': 'linear-gradient(135deg, var(--tw-gradient-stops))',
        'gradient-radial-buzzer': 'radial-gradient(var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
}
