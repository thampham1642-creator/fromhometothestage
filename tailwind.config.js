/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        fredoka: ['Fredoka', 'sans-serif'],
        glacial: ['"Glacial Indifference"', '"Trebuchet MS"', 'sans-serif'],
      },
      colors: {
        cream:  '#FAFAF7',
        warm:   '#F5F2ED',
        sand:   '#E8E3DB',
        ink: {
          DEFAULT: '#1C1C1A',
          2:       '#4A4845',
          3:       '#8A8785',
        },
        accent: {
          DEFAULT: '#D4622A',
          2:       '#E8875A',
        },
      },
    },
  },
  plugins: [],
}
