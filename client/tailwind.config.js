/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        "editor-bg": "#0f0f0f",
        "panel-bg": "#1a1a1a",
        "accent":    "#6c63ff",
        "surface":   "#252525",
        "border-subtle": "#333333",
      },
      fontFamily: {
        sans:   ["Inter", "system-ui", "sans-serif"],
        poppins: ["Poppins", "sans-serif"],
        bebas:  ["Bebas Neue", "cursive"],
      },
    },
  },
  plugins: [],
};
