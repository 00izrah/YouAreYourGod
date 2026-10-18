import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  // TODO: set to the real domain once chosen (used for canonical + Open Graph URLs).
  site: 'https://example.com',
  output: 'static',
  trailingSlash: 'never',
  build: { format: 'directory' },
  image: {
    // Masters are large; allow them through the pipeline.
    service: { entrypoint: 'astro/assets/services/sharp', config: { limitInputPixels: false } },
  },
});
