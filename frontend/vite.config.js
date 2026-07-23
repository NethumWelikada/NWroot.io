// ============================================================
// vite.config.js
// Configures how Vite builds the frontend. "minify: terser"
// ensures production/staging builds are compressed (smaller
// file sizes, faster load times) rather than shipped as raw,
// readable JavaScript.
// ============================================================

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    minify: "terser",       // shrink JS/CSS for production
    terserOptions: {
      compress: {
        drop_console: true, // strip console.log statements from production builds
      },
    },
    outDir: "dist",
  },
  server: {
    port: 5173, // local dev server port (only used with `npm run dev`)
  },
});
