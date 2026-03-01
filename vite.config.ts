import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
// Allow configuring API proxy target via env var `VITE_API_PROXY` or `API_PROXY`.
// Example: VITE_API_PROXY=http://localhost:8081
const API_PROXY = process.env.VITE_API_PROXY || process.env.API_PROXY || 'http://localhost:8081';

export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      // Proxy API requests to example backend; target is configurable via env var
      '/checkout': API_PROXY,
      '/webhook': API_PROXY,
      '/session': API_PROXY,
      '/orders': API_PROXY,
      '/battles': API_PROXY,
      '/courses': API_PROXY,
    },
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
