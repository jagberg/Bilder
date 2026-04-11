// @ts-check
import { defineConfig, passthroughImageService } from 'astro/config';
import { fileURLToPath } from 'node:url';
import keystatic from '@keystatic/astro';
import pagefind from 'astro-pagefind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare({ platformProxy: { enabled: false } }),
  integrations: [react(), keystatic(), pagefind()],
  site: 'https://bilder.com.au',
  image: {
    service: passthroughImageService(),
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ['@keystatic/astro'],
    },
    resolve: {
      alias: {
        sharp: fileURLToPath(new URL('./src/shims/sharp.js', import.meta.url)),
      },
    },
  },
});
