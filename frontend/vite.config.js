import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // Load env variables for the current mode (development / production)
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:5000',
          changeOrigin: true,
        },
      },
    },
    build: {
      // Disable automatic modulepreload injection — prevents the mass of
      // "preloaded but not used" warnings from Vercel's CDN preloading
      // every Font Awesome webfont chunk that isn't immediately consumed.
      modulePreload: false,
      rollupOptions: {
        output: {
          // Keep Font Awesome assets in their own chunk so they're only
          // loaded when actually needed, not eagerly preloaded.
          manualChunks(id) {
            if (id.includes('@fortawesome')) {
              return 'fontawesome';
            }
          },
        },
      },
    },
  };
});

