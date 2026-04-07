/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#1B5E7B',
        accent: '#EAF4F7',
        ink: '#102735',
        muted: '#617A86',
        success: '#2E8B57',
        warning: '#D4A017',
        danger: '#D1495B',
      },
      boxShadow: {
        card: '0 10px 30px rgba(16, 39, 53, 0.08)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
