import nextVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";

const config = [
  // The Zalo Mini App is a separate Vite project with its own tooling.
  { ignores: ["miniapp/**"] },
  ...nextVitals,
  ...nextTypescript,
  {
    rules: {
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off"
    }
  }
];

export default config;
