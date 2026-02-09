/// <reference types="vitest/config" />
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteStaticCopy } from "vite-plugin-static-copy";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig(({mode}) =>{
  return {
    define: {
      // Make environment mode available to the app
      "import.meta.env.MODE": JSON.stringify(mode),
    },
    plugins: [
    react({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
    tailwindcss(),
    viteStaticCopy({
      targets: [
        {
          src: "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
          dest: "",
        },
      ],
    }),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["vite.svg", "pwa.svg", "pdf.worker.min.mjs"],
      manifest: {
        name: "PDF Editor",
        short_name: "PDF Editor",
        description: "Web-based PDF editor for form filling and adding text.",
        theme_color: "#0f172a",
        background_color: "#f1f5f9",
        display: "standalone",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "/pwa.svg",
            sizes: "512x512",
            type: "image/svg+xml",
            purpose: "any maskable",
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/testing/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "clover", "json"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/main.tsx",
        "src/vite-env.d.ts",
        "src/testing/**",
        "src/**/*.test.{ts,tsx}",
      ],
    },
  },
  }
  
});
