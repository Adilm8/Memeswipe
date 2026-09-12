/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        tinder: {
          pink: '#fe3c72',
          coral: '#ff655b',
          orange: '#ff7854',
          canvas: '#f0f2f5',
          nope: '#ff4458',
          like: '#10b981',
          superlike: '#00d4ff',
        }
      }
    },
  },
  plugins: [],
}
