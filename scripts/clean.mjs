import fs from 'node:fs';

for (const dir of ['dist', 'dist-server']) {
  fs.rmSync(dir, { recursive: true, force: true });
}
