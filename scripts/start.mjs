import { existsSync } from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const serverBundle = path.join(root, 'dist-server', 'index.js');
const indexHtml = path.join(root, 'dist', 'index.html');

if (!existsSync(serverBundle) || !existsSync(indexHtml)) {
  console.error('Production build not found. From the project folder, run: npm install && npm run build');
  process.exit(1);
}

// AWS platforms sometimes set NODE_ENV themselves. Set it here so `npm start`
// always serves the built frontend, including on a local production check.
process.env.NODE_ENV = 'production';

await import(pathToFileURL(serverBundle).href);
