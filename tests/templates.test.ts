import { describe, it, expect } from 'vitest';
import { list, get } from '../src/templates';
import path from 'path';

describe('templates', () => {
  it('lists .hbs templates', () => {
    const templates = list();
    expect(templates.length).toBeGreaterThan(0);
    expect(templates.every(t => t.endsWith('.hbs'))).toBe(true);
  });

  it('gets a template by name', () => {
    const info = get('prompt.md.hbs');
    expect(info).not.toBeNull();
    expect(info!.name).toBe('prompt.md.hbs');
    expect(info!.content).toContain('{{title}}');
  });

  it('returns null for missing template', () => {
    expect(get('nonexistent.hbs')).toBeNull();
  });

  it('loads metadata from registry', () => {
    const info = get('prompt.md.hbs');
    expect(info!.metadata.description).toBeTruthy();
    expect(info!.metadata.variables.title).toBeDefined();
    expect(info!.metadata.vinculum.preserves.length).toBeGreaterThan(0);
    expect(info!.metadata.vinculum.sacrifices.length).toBeGreaterThan(0);
  });

  it('all 9 templates have metadata entries', () => {
    const templates = list();
    expect(templates.length).toBe(9);
    for (const t of templates) {
      const info = get(t);
      expect(info!.metadata.description).toBeTruthy();
      expect(Object.keys(info!.metadata.variables).length).toBeGreaterThan(0);
    }
  });
});
