/**
 * Servidor Local Leve e Autônomo para o Sistema da Vidraçaria
 * Não necessita de node_modules (usa apenas módulos nativos do Node.js).
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let PORT = Number(process.env.PORT) || 3000;
const DIST_DIR = path.resolve(__dirname, 'dist');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.pdf': 'application/pdf',
};

function startServer(port) {
  const server = http.createServer((req, res) => {
    // Tratamento de cabeçalhos CORS para segurança local
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');

    const cleanUrl = (req.url || '/').split('?')[0].split('#')[0];
    let safePath = path.normalize(decodeURIComponent(cleanUrl)).replace(/^(\.\.[\/\\])+/, '');
    
    if (safePath === '/' || safePath === '' || safePath === '.') {
      safePath = '/index.html';
    }

    let filePath = path.join(DIST_DIR, safePath);

    fs.stat(filePath, (err, stats) => {
      if (!err && stats.isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=31536000, immutable',
        });
        return fs.createReadStream(filePath).pipe(res);
      }

      // Rota SPA: qualquer rota desconhecida serve o index.html
      const fallbackPath = path.join(DIST_DIR, 'index.html');
      fs.stat(fallbackPath, (fallbackErr, fallbackStats) => {
        if (!fallbackErr && fallbackStats.isFile()) {
          res.writeHead(200, {
            'Content-Type': 'text/html; charset=utf-8',
            'Cache-Control': 'no-cache',
          });
          return fs.createReadStream(fallbackPath).pipe(res);
        }

        // Caso a pasta dist ainda não tenha sido compilada
        res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
          <!DOCTYPE html>
          <html>
            <head><meta charset="utf-8"><title>Sistema Vidraçaria</title></head>
            <body style="font-family: Arial, sans-serif; background: #0f172a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="background: #1e293b; padding: 32px; border-radius: 12px; max-width: 500px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <h2 style="color: #38bdf8; margin-top: 0;">⚠️ Pasta dist não encontrada!</h2>
                <p style="color: #94a3b8; line-height: 1.6;">O sistema precisa ser compilado uma vez antes de rodar localmente.</p>
                <div style="background: #0f172a; padding: 12px; border-radius: 6px; font-family: monospace; color: #4ade80; margin: 16px 0;">
                  npm run build
                </div>
                <p style="font-size: 13px; color: #64748b;">Após compilar, reabra o sistema normalmente.</p>
              </div>
            </body>
          </html>
        `);
      });
    });
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.log(`[AVISO] A porta ${port} ja esta em uso. Tentando a porta ${port + 1}...`);
      startServer(port + 1);
    } else {
      console.error('[ERRO NO SERVIDOR]:', err.message);
    }
  });

  server.listen(port, '0.0.0.0', () => {
    const url = `http://localhost:${port}`;
    console.log(`\n======================================================`);
    console.log(`       SISTEMA DE GESTAO DE VIDRACARIA`);
    console.log(`======================================================`);
    console.log(`  [OK] Servidor local ativo com sucesso!`);
    console.log(`  [OK] Acesso:       ${url}`);
    console.log(`  [OK] Banco Dados:  IndexedDB Local (Offline)`);
    console.log(`------------------------------------------------------`);
    console.log(`  Abrindo o sistema automaticamente no seu navegador...`);
    console.log(`  (Se nao abrir, acesse manualmente: ${url})`);
    console.log(`------------------------------------------------------`);
    console.log(`  * Mantenha esta janela aberta enquanto usar o sistema.`);
    console.log(`  * Para encerrar, basta fechar esta janela.`);
    console.log(`======================================================\n`);

    // Abre o navegador automaticamente
    abrirNavegador(url);
  });
}

function abrirNavegador(url) {
  const isWin = process.platform === 'win32';
  const isMac = process.platform === 'darwin';

  if (isWin) {
    // Tenta abrir Edge em modo App primeiro (visual de aplicativo profissional)
    exec(`start msedge --app=${url}`, (err) => {
      if (err) {
        // Fallback para navegador padrão
        exec(`start ${url}`);
      }
    });
  } else if (isMac) {
    exec(`open ${url}`);
  } else {
    exec(`xdg-open ${url}`);
  }
}

// Inicia o servidor
startServer(PORT);
