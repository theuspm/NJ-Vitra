/**
 * Full-stack Server Entrypoint
 * Mounts Express API routes and Vite dev middleware
 */

import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { apiRouter } from './src/server/supabaseBackend.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));

// Monta as rotas seguras de API do Supabase
app.use('/api', apiRouter);

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, host: '0.0.0.0', port: PORT },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Vidraçaria rodando em http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Server] Falha ao iniciar servidor:', err);
  process.exit(1);
});
