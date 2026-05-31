import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";
import autoprefixer from "autoprefixer";
import path from "path";

export default defineConfig({
  root: ".",
  plugins: [react()],
  css: {
    postcss: {
      plugins: [
        tailwindcss({ config: "./tailwind.hero.config.js" }),
        autoprefixer(),
      ],
    },
  },
  build: {
    outDir: "assets/hero",
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, "src/hero/main.tsx"),
      output: {
        entryFileNames: "liquid-blob-hero.react.js",
        assetFileNames: "liquid-blob-hero.react.[ext]",
        inlineDynamicImports: true,
      },
    },
    cssCodeSplit: false,
  },
});
