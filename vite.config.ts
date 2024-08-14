import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/utm-to-waze/", // Assurez-vous que ce chemin correspond au nom de votre dépôt GitHub
  plugins: [react()],
});
