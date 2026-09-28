/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
      },
      colors: {
        brand: {
          light: '#34d399', // emerald-400
          DEFAULT: '#059669', // emerald-600
          dark: '#064e3b', // emerald-900
          accent: '#10b981', // emerald-500
        }
      }
    },
  },
  plugins: [],
}
