import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/games-gallery/',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 1600 },
  test: { environment: 'node' },
});
