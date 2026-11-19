// Leonida Trophy Atlas — tiny static server for the app/ folder (Node 22,
// standard library only). Development convenience, not a production server:
// `node serve.ts` serves app/ on http://localhost:8080, `--port <n>` picks
// another port. Only files under app/ are ever served, and every response
// carries no-store so a rebuild is never hidden behind a stale cache.

import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const appRoot = resolve(fileURLToPath(new URL('./app', import.meta.url)));

function pickPort(argv) {
  const flag = argv.indexOf('--port');
  const wanted = flag === -1 ? 8080 : Number(argv[flag + 1]);
  if (Number.isInteger(wanted) && wanted > 0 && wanted < 65536) return wanted;
  return 8080;
}

const port = pickPort(process.argv.slice(2));

const contentTypes = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.html', 'text/html; charset=utf-8'],
  ['.jpeg', 'image/jpeg'],
  ['.jpg', 'image/jpeg'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.mjs', 'text/javascript; charset=utf-8'],
  ['.png', 'image/png'],
  ['.svg', 'image/svg+xml'],
  ['.webp', 'image/webp'],
]);

const server = createServer((request, response) => {
  const rawPath = request.url ?? '/';
  let pathname = '/';
  try {
    pathname = decodeURIComponent(new URL(rawPath, 'http://localhost').pathname);
  } catch {
    response.writeHead(400).end('bad request');
    return;
  }
  if (pathname.endsWith('/')) pathname += 'index.html';
  const file = resolve(join(appRoot, normalize(pathname)));
  const inside = file === appRoot || file.startsWith(appRoot + sep);
  if (!inside) {
    response.writeHead(403).end('forbidden');
    return;
  }
  let size = 0;
  try {
    const info = statSync(file);
    if (!info.isFile()) throw new Error('not a file');
    size = info.size;
  } catch {
    response.writeHead(404).end('not found');
    return;
  }
  const type = contentTypes.get(extname(file).toLowerCase()) ?? 'application/octet-stream';
  response.writeHead(200, { 'content-type': type, 'content-length': size, 'cache-control': 'no-store' });
  createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`Leonida Trophy Atlas is on http://localhost:${port}`);
});
