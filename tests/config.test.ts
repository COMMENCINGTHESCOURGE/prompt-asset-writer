import { describe, it, expect, beforeEach } from 'vitest';
import { getConfig, resetConfig } from '../src/config';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('config', () => {
  const tmpDir = path.join(os.tmpdir(), 'paw-test-config');

  beforeEach(() => {
    resetConfig();
    fs.removeSync(tmpDir);
    fs.ensureDirSync(tmpDir);
  });

  it('returns empty config when no file exists', () => {
    const cwd = process.cwd();
    process.chdir(tmpDir);
    const cfg = getConfig();
    expect(Object.keys(cfg)).toHaveLength(0);
    process.chdir(cwd);
  });

  it('reads config from prompt-asset-writer.json', () => {
    fs.writeJsonSync(path.join(tmpDir, 'prompt-asset-writer.json'), {
      defaultTemplate: 'prompt.md.hbs',
      validate: false
    });
    const cwd = process.cwd();
    process.chdir(tmpDir);
    const cfg = getConfig();
    expect(cfg.defaultTemplate).toBe('prompt.md.hbs');
    expect(cfg.validate).toBe(false);
    process.chdir(cwd);
  });

  it('reads config from .prompt-asset-writer.json', () => {
    fs.writeJsonSync(path.join(tmpDir, '.prompt-asset-writer.json'), {
      defaultTemplate: 'manifest.md.hbs'
    });
    const cwd = process.cwd();
    process.chdir(tmpDir);
    const cfg = getConfig();
    expect(cfg.defaultTemplate).toBe('manifest.md.hbs');
    process.chdir(cwd);
  });
});
