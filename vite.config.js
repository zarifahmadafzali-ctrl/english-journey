import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "./", // relative: works in Capacitor (APK) and on GitHub Pages
  build: {
    outDir: "dist",
    sourcemap: false
  }
});
