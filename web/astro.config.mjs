// @ts-check
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'astro/config';

export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: { exclude: ['@mentiroso/shared'] },
    ssr: { noExternal: ['@mentiroso/shared'] },
  },
  server: { port: Number(process.env.PORT ?? 4321) },
});
