import { describe, it, expect } from 'vitest';
import { writeAtomic } from '../src/atomic-writer';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

describe('atomic-writer', () => {
  const tmpDir = path.join(os.tmpdir(), 'paw-test-atomic');

  it('writes file atomically', () => {
    const target = path.join(tmpDir, 'test.md');
    writeAtomic(target, '# Hello');
    expect(fs.existsSync(target)).toBe(true);
    expect(fs.readFileSync(target, 'utf-8')).toBe('# Hello');
    fs.unlinkSync(target);
  });

  it('creates intermediate directories', () => {
    const target = path.join(tmpDir, 'sub', 'nested', 'test.md');
    writeAtomic(target, 'nested');
    expect(fs.existsSync(target)).toBe(true);
    fs.removeSync(tmpDir);
  });
});
