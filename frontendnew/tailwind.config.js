/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'google-sans': ['Google Sans', 'sans-serif'], // Use Google Sans globally
      },
    },
  },
  plugins: [],
};