import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#FBF6ED",
        offwhite: "#F7F1E4",
        earth: {
          50: "#FBF3E9",
          100: "#F1E1C6",
          200: "#E3C398",
          300: "#CE9C63",
          400: "#B97B42",
          500: "#8F5A2E", // primary earthy brown
          600: "#734524",
          700: "#5A351C",
          800: "#402612",
          900: "#2A190C",
        },
        spice: {
          500: "#B23A22", // deep chilli red-brown accent
          600: "#8F2C19",
        },
      },
      fontFamily: {
        serif: ["Georgia", "'Playfair Display'", "serif"],
        sans: ["'Segoe UI'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(64,38,18,0.08)",
        card: "0 4px 20px rgba(64,38,18,0.10)",
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(12px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        pop: { "0%": { transform: "scale(1)" }, "50%": { transform: "scale(1.06)" }, "100%": { transform: "scale(1)" } },
      },
      animation: {
        fadeUp: "fadeUp 0.6s ease-out both",
        pop: "pop 0.3s ease-in-out",
      },
    },
  },
  plugins: [],
};
export default config;
