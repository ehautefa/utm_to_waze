import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  base: "/utm_to_waze/", // Assurez-vous que ce chemin correspond au nom de votre dépôt GitHub
  plugins: [react()],
});
