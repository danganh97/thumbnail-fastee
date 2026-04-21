import type { Config } from 'tailwindcss'
import forms from '@tailwindcss/forms'

export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        soft: '0 4px 24px 0 rgba(99,102,241,0.12)',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
      },
    },
  },
  plugins: [forms],
} satisfies Config
