/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'nu-green': '#006432',
        'nu-gold': '#c5a059',
      }
    },
  },
  plugins: [],
}