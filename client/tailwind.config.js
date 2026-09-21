/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#090d16',
        surface: {
          800: '#111827',
          900: '#0b0f19',
          950: '#06090e'
        },
        primary: {
          400: '#38bdf8',
          500: '#0ea5e9',
          600: '#0284c7'
        },
        incident: {
          earthquake: '#ef4444',
          wildfire: '#f97316',
          storm: '#06b6d4'
        }
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'spin-slow': 'spin 12s linear infinite',
      }
    },
  },
  plugins: [],
}
