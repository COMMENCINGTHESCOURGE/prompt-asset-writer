import fs from 'fs-extra';
import path from 'path';

export interface PawConfig {
  templatesDir?: string;
  defaultTemplate?: string;
  validate?: boolean;
}

const CONFIG_FILES = [
  'prompt-asset-writer.json',
  '.prompt-asset-writer.json'
];

function resolveConfig(startDir: string): PawConfig | null {
  let dir = path.resolve(startDir);
  while (true) {
    for (const name of CONFIG_FILES) {
      const fp = path.join(dir, name);
      if (fs.existsSync(fp)) {
        try {
          return fs.readJsonSync(fp) as PawConfig;
        } catch {
          return null;
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

let cached: PawConfig | null | undefined;

export function getConfig(cwd?: string): PawConfig {
  if (cached !== undefined) return cached ?? {};
  const found = resolveConfig(cwd ?? process.cwd());
  cached = found ?? {};
  return cached ?? {};
}

export function resetConfig(): void {
  cached = undefined;
}
