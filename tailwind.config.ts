import type { Config } from "tailwindcss";

// The site is styled in app/globals.css; Tailwind's utilities are only used by
// app/not-found.tsx, so the default theme is all it needs.
const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: { extend: {} },
  plugins: [],
};

export default config;
