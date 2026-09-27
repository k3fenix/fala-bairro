/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#3b82f6', // blue-500
          DEFAULT: '#1d4ed8', // blue-700
          dark: '#1e3a8a', // blue-900
          accent: '#f59e0b', // amber-500
        }
      }
    },
  },
  plugins: [],
}
