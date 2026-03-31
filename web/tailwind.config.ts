import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#4338ca',
          700: '#3730a3',
        },
      },
      boxShadow: {
        soft: '0 20px 80px rgba(15, 23, 42, 0.12)',
      },
    },
  },
  plugins: [require('@tailwindcss/forms')],
};

export default config;
