import inject from "@rollup/plugin-inject";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    rollupOptions: {
      plugins: [inject({ buffer: ["buffer", "Buffer"] })],
    },
  },
  plugins: [react()],
});
