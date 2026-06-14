import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

const frontendDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(frontendDir, "..");

export default defineConfig(({ command }) => ({
  root: frontendDir,
  envDir: rootDir,
  plugins: [
    react(),
    tailwindcss(),
    command === "serve" && process.env.VITE_DEV_HTTPS === "true" ? basicSsl() : null,
  ],
  resolve: {
    alias: {
      "@": path.resolve(frontendDir, "src"),
    },
  },
  build: {
    outDir: path.resolve(rootDir, "dist"),
    emptyOutDir: true,
  },
  server: {
    host: "127.0.0.1",
    port: 5173,
    allowedHosts: [".ngrok-free.dev", ".ngrok-free.app"],
    proxy: {
      "/api": {
        target: `http://127.0.0.1:${process.env.BACKEND_PORT || "8787"}`,
        changeOrigin: true,
      },
    },
  },
}));
