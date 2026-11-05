import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://www.soulside.ai',
  output: 'static',
  // Match Webflow's URLs (/contact, not /contact/) so existing links and rankings carry over.
  trailingSlash: 'never',
  build: { format: 'file' },
});
