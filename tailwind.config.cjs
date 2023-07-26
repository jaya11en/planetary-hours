/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        venus: '#22d3ee',
        mercury: '#fcd34d',
        moon: '#c4b5fd',
        saturn: '#fde047',
        jupiter: '#5b21b6',
        mars: '#e11d48',
        sun: '#fbbf24'
      },
    },
  },
  plugins: [],
};
