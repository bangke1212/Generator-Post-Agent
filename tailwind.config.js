/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // v2 cerah: kertas hangat + putih bersih, teks tinta kontras tinggi.
        // Aksen: biru X (#1D9BF0) untuk brand/nav/aksi, oranye hangat
        // (#F97316) hanya untuk CTA Generate, hijau hanya untuk sukses.
        ink: {
          DEFAULT: '#0F172A',
          panel: '#FFFFFF',
          raised: '#F8FAFC',
          input: '#FFFFFF',
          rail: '#FFFFFF',
        },
        paper: '#0F172A',
        fog: '#475569',
        mist: '#64748B',
        line: {
          DEFAULT: '#E7E5E0',
          strong: '#CBD5E1',
        },
        signal: {
          DEFAULT: '#1D9BF0',
          ink: '#FFFFFF',
          soft: '#E8F4FD',
        },
        warm: {
          DEFAULT: '#F97316',
          ink: '#FFFFFF',
          soft: '#FFF1E6',
        },
        success: '#059669',
        danger: '#DC2626',
        warning: '#B45309',
        // Kunci lama dipertahankan agar class yang masih memakainya tetap
        // jalan; nilainya dipetakan ke palet cerah v2.
        primary: '#1D9BF0',
        'primary-light': '#4FB3F6',
        'primary-dark': '#1A8CD8',
        accent: '#F97316',
        'accent-light': '#FFF1E6',
        dark: '#0F172A',
        'dark-card': '#FFFFFF',
        'dark-elevated': '#F8FAFC',
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
