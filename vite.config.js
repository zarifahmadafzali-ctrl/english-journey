import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Relative base works for Capacitor Android and for GitHub Pages
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
