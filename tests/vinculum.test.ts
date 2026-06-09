import { describe, it, expect } from 'vitest';
import { get } from '../src/templates';
import { analyze, formatReport } from '../src/vinculum';

describe('vinculum', () => {
  it('generates analysis for a template', () => {
    const info = get('prompt.md.hbs')!;
    const report = analyze(info);
    expect(report.template).toBe('prompt.md.hbs');
    expect(report.preserves.length).toBeGreaterThan(0);
    expect(report.sacrifices.length).toBeGreaterThan(0);
    expect(report.variables.length).toBeGreaterThan(0);
  });

  it('reports variable status with data', () => {
    const info = get('prompt.md.hbs')!;
    const report = analyze(info, { title: 'X' });
    const titleVar = report.variables.find(v => v.name === 'title');
    expect(titleVar!.status).toBe('provided');
  });

  it('reports missing required variables', () => {
    const info = get('prompt.md.hbs')!;
    const report = analyze(info);
    const titleVar = report.variables.find(v => v.name === 'title');
    expect(titleVar!.status).toBe('required (missing)');
  });

  it('formatReport produces markdown', () => {
    const info = get('prompt.md.hbs')!;
    const report = analyze(info);
    const md = formatReport(report);
    expect(md).toContain('Vinculum Analysis');
    expect(md).toContain('Central Vinculum');
    expect(md).toContain('Preserves');
    expect(md).toContain('Sacrifices');
  });
});
