import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// When building for GitHub Pages on a project site, all assets must be
// served from `/<repo>/`. The deploy workflow exports VITE_BASE; otherwise
// keep root-relative paths so local dev (and other hosts) still work.
const base = process.env.VITE_BASE || '/';

export default defineConfig({
  base,
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 5173,
  },
  build: {
    target: 'es2020',
  },
});
