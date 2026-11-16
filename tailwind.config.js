/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          DEFAULT: '#0A0E13',
          panel: '#111823',
          raised: '#161F2C',
          input: '#0D131C',
          rail: '#0C1118',
        },
        paper: '#EDEFF2',
        fog: '#9AA7B8',
        mist: '#64748B',
        line: {
          DEFAULT: '#1E2937',
          strong: '#2C3B4E',
        },
        signal: {
          DEFAULT: '#2DD4A7',
          ink: '#06281F',
          soft: '#5EE6C0',
        },
        // Kunci lama dipertahankan agar class yang masih memakainya tetap jalan,
        // nilainya dipetakan ke palet baru (bukan lagi indigo/cyan generik).
        primary: '#EDEFF2',
        'primary-light': '#FFFFFF',
        'primary-dark': '#C7CDD6',
        accent: '#2DD4A7',
        'accent-light': '#5EE6C0',
        dark: '#0A0E13',
        'dark-card': '#111823',
        'dark-elevated': '#161F2C',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        control: '8px',
        tag: '6px',
      },
    },
  },
  plugins: [],
};
