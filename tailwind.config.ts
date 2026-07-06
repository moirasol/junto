import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#EDFBF5",
          100: "#CFF3E3",
          200: "#9FE6C7",
          300: "#67D2A7",
          400: "#34B989",
          500: "#129C70",
          600: "#0B7F5C",
          700: "#0A6549",
          800: "#0B513C",
          900: "#0C4232",
        },
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "sans-serif"],
        display: ["var(--font-manrope)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
