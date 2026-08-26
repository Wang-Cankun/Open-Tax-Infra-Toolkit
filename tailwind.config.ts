import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        bg: "#FAFAF7",
        surface: "#FFFFFF",
        navy: { DEFAULT: "#003366", light: "#EBF2FA", hover: "#004488" },
        ink: { DEFAULT: "#1B2332", muted: "#64748B", faint: "#94A3B8" },
        teal: { DEFAULT: "#0891B2", light: "#ECFEFF" },
        amber: { DEFAULT: "#D97706", light: "#FFFBEB" },
        danger: { DEFAULT: "#B91C1C", light: "#FEF2F2" },
        rule: "#E2E8F0",
      },
      fontFamily: {
        display: ['"Newsreader"', "Georgia", "serif"],
        body: ['"DM Sans"', "system-ui", "sans-serif"],
        mono: ['"JetBrains Mono"', "Menlo", "monospace"],
      },
    },
  },
  plugins: [],
};
export default config;
