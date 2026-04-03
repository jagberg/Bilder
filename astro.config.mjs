// @ts-check
import { defineConfig } from 'astro/config';
import keystatic from '@keystatic/astro';
import pagefind from 'astro-pagefind';
import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [react(), keystatic(), pagefind()],
  site: 'https://bilder.com.au',
});
