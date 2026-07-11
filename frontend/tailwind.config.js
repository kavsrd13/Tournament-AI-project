/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f7f9fb',
        surface: '#f7f9fb',
        'surface-dim': '#d8dadc',
        primary: '#00236f',
        'primary-container': '#1e3a8a',
        'on-primary': '#ffffff',
        secondary: '#006e2f',
        'on-secondary': '#ffffff',
        tertiary: '#4b1c00',
        error: '#ba1a1a',
      },
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'sans-serif'],
        display: ['Anybody', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '0.5rem',
        sm: '0.25rem',
        md: '0.75rem',
        lg: '1rem',
        xl: '1.5rem',
      }
    },
  },
  plugins: [],
}
