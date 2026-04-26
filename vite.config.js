import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

// Vite dev/build config for the love-story app.
export default defineConfig({
  plugins: [vue()],
  server: {
    host: true,
    port: 5173,
  },
});
