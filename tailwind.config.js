/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./**/*.{html,js}",
  ],
  theme: {
    extend: {
      spacing: {
        // Add custom spacing values here if needed
      },
    },
  },
  plugins: [],
  safelist: [
    'my-auto',
    'mt-auto',
    'mb-auto',
    'max-h-[70%]'
  ]
} 