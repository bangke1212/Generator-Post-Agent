/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#6366f1',
        'primary-light': '#818cf8',
        'primary-dark': '#4f46e5',
        accent: '#06b6d4',
        'accent-light': '#22d3ee',
        dark: '#0a0a1a',
        'dark-card': '#111133',
        'dark-elevated': '#161644',
      },
    },
  },
  plugins: [],
};
