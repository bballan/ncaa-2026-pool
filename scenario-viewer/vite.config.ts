import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { scenariosLiveFromOutput } from "./vite-plugin-scenarios-live";

const viewerRoot = path.dirname(fileURLToPath(import.meta.url));

// Relative base works on GitHub Pages project sites and local file preview.
export default defineConfig({
  plugins: [react(), scenariosLiveFromOutput(viewerRoot)],
  base: "./",
});
