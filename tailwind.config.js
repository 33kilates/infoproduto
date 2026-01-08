/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./**/*.{html,js}"],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: '#08418e',
          teal: '#2cc6b6',
          dark: '#0a192f',
          light: '#f8f9fa'
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        heading: ['Outfit', 'sans-serif'],
      },
      boxShadow: {
        'glow': '0 0 20px rgba(44, 198, 182, 0.3)',
        'card': '0 10px 30px -10px rgba(0, 0, 0, 0.1)'
      }
    }
  },
  plugins: [],
}
