/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx}", "./components/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#2b2622", 
        paper: "#ffffff", // <-- Ubah paper menjadi putih
        white: "#8BA296",
        cream: "#f3ead9",
        plum: { DEFAULT: "#7a2e3e", dark: "#5e2130" },
        gold: "#c9a661",
      },
      fontFamily: {
        display: ['"Playfair Display"', "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
