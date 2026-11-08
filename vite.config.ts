import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// Large libraries that only some pages need get their own chunks,
// so the main bundle stays small.
const chunkGroups: Record<string, string[]> = {
  landing: ["framer-motion"],
  student: ["compromise"],
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          for (const [chunk, packages] of Object.entries(chunkGroups)) {
            if (packages.some((pkg) => id.includes(`/node_modules/${pkg}/`))) return chunk;
          }
        },
      },
    },
  },
});
