import cloudflare from '@astrojs/cloudflare';
import react from '@astrojs/react';
import sanity from '@sanity/astro';
import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.soulside.ai',
  // Public pages are prerendered at build time. Only the Visual Editing preview
  // (src/pages/preview, src/pages/api/draft-mode) renders on demand in the Worker.
  output: 'static',
  adapter: cloudflare({
    prerenderEnvironment: 'node', // build static pages in Node, as before
    imageService: 'passthrough', // the site doesn't use Astro image transforms
  }),
  // Match Webflow's URLs (/contact, not /contact/) so existing links and rankings carry over.
  session: false, // no Astro sessions, so no KV namespace to provision
  trailingSlash: 'never',
  build: { format: 'file' },
  vite: {
    // Dev only: pre-bundle the Visual Editing overlay's CommonJS dependencies (lodash via @sanity/mutate)
    // so the overlay hydrates in the browser.
    optimizeDeps: { include: ['@sanity/visual-editing/react', '@sanity/mutate'] },
  },
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
