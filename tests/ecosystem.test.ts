import { describe, it, expect } from 'vitest';
import { formatEcosystemReport } from '../src/ecosystem';
import type { EcosystemReport } from '../src/ecosystem';

describe('ecosystem', () => {
  const mockReport: EcosystemReport = {
    owner: 'COMMENCINGTHESCOURGE',
    totalRepos: 10,
    nonEmptyRepos: 7,
    documentedRepos: 5,
    repos: [
      { name: 'hyperpoly-terrain', fullName: 'COMMENCINGTHESCOURGE/hyperpoly-terrain', description: 'GPU engine', language: 'JavaScript', topics: ['webgpu', 'field-computation'], stars: 1, hasIssues: true, hasWiki: true, hasDiscussions: false, license: 'MIT', pushedAt: '2026-06-01', createdAt: '2026-01-01', isEmpty: false, docScore: 5 },
      { name: 'empty-repo', fullName: 'COMMENCINGTHESCOURGE/empty-repo', description: '', language: null, topics: [], stars: 0, hasIssues: false, hasWiki: false, hasDiscussions: false, license: null, pushedAt: '2026-06-01', createdAt: '2026-01-01', isEmpty: true, docScore: 0 },
    ],
    languages: { JavaScript: 1 },
    topics: { webgpu: 1, 'field-computation': 1 },
    avgDocScore: 2.5
  };

  it('formatEcosystemReport produces markdown', () => {
    const md = formatEcosystemReport(mockReport);
    expect(md).toContain('MANIFOLD Ecosystem Report');
    expect(md).toContain('COMMENCINGTHESCOURGE');
    expect(md).toContain('10');
    expect(md).toContain('hyperpoly-terrain');
    expect(md).toContain('empty-repo');
  });

  it('marks empty repos in output', () => {
    const md = formatEcosystemReport(mockReport);
    expect(md).toContain('empty-repo (empty)');
    expect(md).not.toContain('hyperpoly-terrain (empty)');
  });
});
