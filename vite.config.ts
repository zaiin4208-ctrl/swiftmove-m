import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import { handleTRPC } from './server/trpc';

const rawPort = process.env.PORT ?? '5173';
const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const basePath = process.env.BASE_PATH ?? '/';

export default defineConfig({
  base: basePath,
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'local-trpc',
      configureServer(server) {
        server.middlewares.use('/trpc', async (req, res) => {
          const url = `http://${req.headers.host ?? `localhost:${port}`}/trpc${req.url ?? ''}`;
          const body = req.method === 'GET' || req.method === 'HEAD' ? undefined : await new Promise<string>((resolve, reject) => {
            let data = '';
            req.on('data', chunk => { data += chunk; });
            req.on('end', () => resolve(data));
            req.on('error', reject);
          });
          const response = await handleTRPC(new Request(url, { method: req.method, headers: req.headers as Record<string, string>, body }));
          res.statusCode = response.status;
          response.headers.forEach((value, key) => res.setHeader(key, value));
          res.end(await response.text());
        });
      },
    },
  ],
  resolve: {
    alias: {
      '@': new URL('./src', import.meta.url).pathname,
    },
    dedupe: ['react', 'react-dom'],
  },
  root: new URL('.', import.meta.url).pathname,
  build: {
    outDir: new URL('./dist/public', import.meta.url).pathname,
    emptyOutDir: true,
  },
  server: {
    port,
    strictPort: true,
    host: '0.0.0.0',
    allowedHosts: true,
    fs: {
      strict: true,
    },
  },
  preview: {
    port,
    host: '0.0.0.0',
    allowedHosts: true,
  },
});
