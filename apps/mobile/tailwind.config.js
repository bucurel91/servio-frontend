/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  darkMode: "class",
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        primary: "#1A56DB",
        "primary-dark": "#1347B8",
        surface: "#F8FAFC",
        muted: "#6B7280",
        danger: "#EF4444",
        success: "#22C55E",
      },
    },
  },
  plugins: [],
};
