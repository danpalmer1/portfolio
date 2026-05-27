// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://danpalmer.dev',
  integrations: [react(), mdx(), sitemap()],

  markdown: {
    shikiConfig: {
      theme: 'github-dark-default',
      wrap: false,
    },
  },

  vite: {
    plugins: [tailwindcss()]
  }
});
