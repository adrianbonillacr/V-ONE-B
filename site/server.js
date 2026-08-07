// V-ONE-B — servidor estático sin dependencias.
// node server.js  ->  http://localhost:3000
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = process.env.PORT || 3000;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon',
};

function send(res, code, body, type, extra = {}) {
  res.writeHead(code, { 'Content-Type': type, ...extra });
  res.end(body);
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = decodeURIComponent(req.url.split('?')[0]);
  } catch {
    return send(res, 400, 'Bad request', 'text/plain');
  }

  // Bloquea traversal fuera de ROOT.
  const target = path.normalize(path.join(ROOT, url));
  if (!target.startsWith(ROOT)) return send(res, 403, 'Forbidden', 'text/plain');

  fs.stat(target, (err, stat) => {
    const isFile = !err && stat.isFile();
    // SPA fallback: cualquier ruta sin archivo sirve index.html
    const file = isFile ? target : path.join(ROOT, 'index.html');
    const ext = path.extname(file).toLowerCase();
    fs.readFile(file, (e, buf) => {
      if (e) return send(res, 404, 'No encontrado', 'text/plain; charset=utf-8');
      // Fuentes e imágenes son inmutables; el código se revalida siempre
      // para que los cambios se vean sin vaciar la caché a mano.
      const longLived = ['.woff2', '.png', '.jpg', '.jpeg', '.svg', '.webp', '.ico'].includes(ext);
      const cache = longLived ? 'public, max-age=86400' : 'no-store';
      send(res, isFile || ext === '.html' ? 200 : 404, buf, MIME[ext] || 'application/octet-stream', {
        'Cache-Control': cache,
      });
    });
  });
});

server.listen(PORT, () => {
  console.log(`\n  V-ONE-B  ->  http://localhost:${PORT}\n`);
});
