import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import ZaloMiniApp from "zmp-vite-plugin";
// App settings live in app-settings.json, not app-config.json: `zmp deploy`
// reads ./app-config.json first, and that copy has no asset lists. Without it,
// the CLI falls back to www/app-config.json, which the plugin below generates.
import settings from "./app-settings.json";

// Same layout as Zalo's templates: index.html lives in src/.
export default defineConfig({
  root: "./src",
  base: "",
  // .env / .env.local sit next to package.json, not in src/.
  envDir: "..",
  plugins: [react(), ZaloMiniApp(settings)],
  // zmp deploy uploads ./www (vite's outDir is relative to root, i.e. src/).
  build: { outDir: "../www", emptyOutDir: true },
  // The places come from the website's ../app/data/foods.json (one source of truth).
  server: { fs: { allow: [".."] } },
  // Don't pick up the website's PostCSS/Tailwind config from the parent folder.
  css: { postcss: {} },
});
