import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        primary: "#ddb7ff",
        "on-primary-fixed-variant": "#622599",
        "surface-tint": "#ddb7ff",
        "on-tertiary-fixed-variant": "#693c12",
        "surface-container": "#241d2a",
        "tertiary-container": "#4f2700",
        "surface-bright": "#3e3644",
        "secondary-fixed": "#f0dbff",
        "surface-container-lowest": "#120c18",
        "on-primary": "#4a0080",
        background: "#17111d",
        "on-secondary-fixed": "#26113a",
        "error-container": "#93000a",
        outline: "#978d9d",
        "surface-container-low": "#201926",
        "on-surface": "#ebdef1",
        "on-background": "#ebdef1",
        "outline-variant": "#4c4451",
        "inverse-primary": "#7b41b3",
        "inverse-on-surface": "#352d3b",
        "tertiary-fixed-dim": "#fbb884",
        "on-secondary": "#3c2751",
        "on-error-container": "#ffdad6",
        "on-tertiary": "#4d2600",
        "primary-fixed-dim": "#ddb7ff",
        "primary-container": "#4b0082",
        "on-primary-container": "#ba7ef4",
        tertiary: "#fbb884",
        "surface-container-highest": "#393240",
        "surface-dim": "#17111d",
        "on-tertiary-container": "#c98c5c",
        "primary-fixed": "#f0dbff",
        error: "#ffb4ab",
        "on-error": "#690005",
        "on-primary-fixed": "#2c0050",
        "secondary-container": "#543d69",
        "tertiary-fixed": "#ffdcc3",
        "secondary-fixed-dim": "#d8bcef",
        "on-secondary-fixed-variant": "#543d69",
        "surface-container-high": "#2e2735",
        "inverse-surface": "#ebdef1",
        "surface-variant": "#393240",
        "on-secondary-container": "#c6aadd",
        secondary: "#d8bcef",
        surface: "#17111d",
        "on-tertiary-fixed": "#2f1500",
        "on-surface-variant": "#cec3d3"
      },
      fontFamily: {
        headline: ["Manrope", "sans-serif"],
        body: ["Inter", "sans-serif"],
        label: ["Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "9999px"
      }
    }
  },
  plugins: []
};

export default config;
