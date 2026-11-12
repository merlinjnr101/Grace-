import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, type Plugin } from 'vite';

const rootDir = path.dirname(fileURLToPath(import.meta.url));

// The API router (and its Telegram poller / file-backed store) is only loaded
// when the dev server starts. Importing it at the top level starts a polling
// loop that keeps `vite build` from ever exiting.
function sogBackendPlugin(): Plugin {
  return {
    name: 'sog-backend-plugin',
    apply: 'serve',
    async configureServer(server) {
      const { default: express } = await import('express');
      const { default: apiRouter } = await import('./server/api.ts');
      const app = express();
      app.use(express.json());
      app.use('/api', apiRouter);
      server.middlewares.use(app);
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), sogBackendPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(rootDir, '.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1200,
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
