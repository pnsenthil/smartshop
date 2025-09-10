import { defineConfig } from 'vite';

export default defineConfig({
  base: '/smartshop/',
  server: {
    port: 5173
  },
  build: {
    sourcemap: true
  },
  test: {
    environment: 'jsdom'
  }
});


