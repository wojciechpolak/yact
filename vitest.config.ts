import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [{find: '@', replacement: resolve(__dirname, './src')}]
  },
  test: {
    environment: 'jsdom',
  },
});
