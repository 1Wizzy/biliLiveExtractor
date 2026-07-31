// Vite build config. The static frontend lives in `public/`; Vite treats that
// as the root, bundles `main.mjs` (which imports the original unchanged source
// scripts) plus the CSS, and emits content-hashed assets into `dist/`.
//
// This file is `.mjs` so it can use ESM syntax without touching the root
// package.json, which must stay CommonJS for the `api/**` serverless functions.
import { defineConfig } from "vite";

export default defineConfig({
  root: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
});
