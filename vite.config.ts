import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: { target: 'es2020', assetsInlineLimit: 0 },
  // `npm run dev` runs the street server on 8787 alongside Vite
  server: { proxy: { '/api': { target: 'http://127.0.0.1:8787', ws: true } } },
});
