import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.soulside.ai',
  output: 'static',
  // Match Webflow's URLs (/contact, not /contact/) so existing links and rankings carry over.
  trailingSlash: 'never',
  build: { format: 'file' },
  integrations: [
    sanity({
      projectId: '7k5xgu7v',
      dataset: 'production',
      apiVersion: '2026-11-01',
      useCdn: false, // static build: always read fresh content
      studioBasePath: '/admin',
      injectTypes: true,
    }),
    react(),
  ],
});
