/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#F5F0E7', cream: '#EAE0D2', espresso: '#2B1B16', coffee: '#38251D',
        roast: '#72513B', taupe: '#A89179', champagne: '#C6AD8B',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['Manrope', 'system-ui', 'sans-serif'],
      },
      letterSpacing: { label: '0.14em' },
    },
  },
  plugins: [],
};
