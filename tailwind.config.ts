import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f2faf7",
          100: "#dcf1e8",
          200: "#b8e3d1",
          300: "#8ccdb4",
          400: "#5eaf93",
          500: "#3f9078",
          600: "#2f7260",
          700: "#295c4e",
          800: "#244a40",
          900: "#1f3e36",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
