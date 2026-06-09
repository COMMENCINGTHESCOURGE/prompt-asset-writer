import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import crypto from 'crypto';

export function writeAtomic(filePath: string, content: string): void {
  const dir = path.dirname(filePath);
  fs.ensureDirSync(dir);

  const tmpName = `.${path.basename(filePath)}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  const tmpPath = path.join(os.tmpdir(), tmpName);

  fs.writeFileSync(tmpPath, content, 'utf-8');
  fs.moveSync(tmpPath, filePath, { overwrite: true });
}
