import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base path so asset URLs work inside itch.io's iframe sandbox.
  base: './',
  build: {
    // Phaser's minified bundle exceeds Vite's default 500 kB warning threshold.
    // This is expected and documented; we've already split it into its own
    // vendor chunk. Further reduction requires per-module Phaser imports and
    // is deferred post-ship.
    chunkSizeWarningLimit: 1400,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/phaser')) {
            return 'phaser-vendor';
          }

          if (id.includes('node_modules')) {
            return 'vendor';
          }

          return undefined;
        }
      }
    }
  }
});
