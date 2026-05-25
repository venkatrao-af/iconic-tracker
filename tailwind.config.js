/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'acres-teal': '#14A085',
      },
      animation: {
        'bounce-delay-100': 'bounce 1s infinite 100ms',
        'bounce-delay-200': 'bounce 1s infinite 200ms',
      },
    },
  },
  plugins: [],
}
