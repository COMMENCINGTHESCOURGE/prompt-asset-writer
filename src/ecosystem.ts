import fs from 'fs-extra';
import path from 'path';
import https from 'https';

export interface RepoInfo {
  name: string;
  fullName: string;
  description: string;
  language: string | null;
  topics: string[];
  stars: number;
  hasIssues: boolean;
  hasWiki: boolean;
  hasDiscussions: boolean;
  license: string | null;
  pushedAt: string;
  createdAt: string;
  isEmpty: boolean;
  docScore: number;
}

export interface EcosystemReport {
  owner: string;
  totalRepos: number;
  nonEmptyRepos: number;
  documentedRepos: number;
  repos: RepoInfo[];
  languages: Record<string, number>;
  topics: Record<string, number>;
  avgDocScore: number;
}

function githubFetch(path: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const options: https.RequestOptions = {
      hostname: 'api.github.com',
      path,
      headers: {
        'User-Agent': 'prompt-asset-writer',
        'Accept': 'application/vnd.github.v3+json'
      }
    };

    const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
    if (token && options.headers) {
      (options.headers as Record<string, string>)['Authorization'] = `token ${token}`;
    }

    https.get(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 403) {
          reject(new Error('GitHub API rate limit exceeded. Set GITHUB_TOKEN env var.'));
        } else if (res.statusCode && res.statusCode >= 400) {
          reject(new Error(`GitHub API error ${res.statusCode}: ${data.slice(0, 200)}`));
        } else {
          resolve(data);
        }
      });
    }).on('error', reject);
  });
}

export async function discover(owner: string = 'COMMENCINGTHESCOURGE'): Promise<EcosystemReport> {
  const data = await githubFetch(`/users/${owner}/repos?per_page=100&sort=updated`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const repos: any[] = JSON.parse(data);

  const repoInfos: RepoInfo[] = repos.map((r: any) => {
    const docScore = [
      r.description ? 1 : 0,
      r.topics && r.topics.length > 0 ? 1 : 0,
      r.license ? 1 : 0,
      r.has_issues ? 1 : 0,
      r.has_wiki ? 1 : 0,
    ].reduce((a: number, b: number) => a + b, 0);

    return {
      name: r.name,
      fullName: r.full_name,
      description: r.description || '',
      language: r.language,
      topics: r.topics || [],
      stars: r.stargazers_count,
      hasIssues: r.has_issues,
      hasWiki: r.has_wiki,
      hasDiscussions: r.has_discussions || false,
      license: r.license?.spdx_id || null,
      pushedAt: r.pushed_at,
      createdAt: r.created_at,
      isEmpty: r.size === 0,
      docScore
    };
  });

  const languages: Record<string, number> = {};
  const topics: Record<string, number> = {};

  for (const r of repoInfos) {
    if (r.language) languages[r.language] = (languages[r.language] || 0) + 1;
    for (const t of r.topics) topics[t] = (topics[t] || 0) + 1;
  }

  const nonEmpty = repoInfos.filter(r => !r.isEmpty);
  const documented = repoInfos.filter(r => r.docScore >= 3);
  const avgScore = repoInfos.reduce((s, r) => s + r.docScore, 0) / repoInfos.length;

  return {
    owner,
    totalRepos: repoInfos.length,
    nonEmptyRepos: nonEmpty.length,
    documentedRepos: documented.length,
    repos: repoInfos.sort((a, b) => b.docScore - a.docScore),
    languages,
    topics,
    avgDocScore: Math.round(avgScore * 100) / 100
  };
}

export function formatEcosystemReport(report: EcosystemReport): string {
  const lines: string[] = [];

  lines.push(`# MANIFOLD Ecosystem Report`);
  lines.push(`**Owner**: ${report.owner}`);
  lines.push(`**Generated**: ${new Date().toISOString().split('T')[0]}`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Total Repos | ${report.totalRepos} |`);
  lines.push(`| Non-Empty Repos | ${report.nonEmptyRepos} |`);
  lines.push(`| Well-Documented (score ≥ 3) | ${report.documentedRepos} |`);
  lines.push(`| Avg Documentation Score | ${report.avgDocScore}/5 |`);
  lines.push('');
  lines.push('## Languages');
  lines.push('');
  for (const [lang, count] of Object.entries(report.languages).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${lang}: ${count}`);
  }
  lines.push('');
  lines.push('## Topics');
  lines.push('');
  for (const [topic, count] of Object.entries(report.topics).sort((a, b) => b[1] - a[1])) {
    lines.push(`- ${topic}: ${count}`);
  }
  lines.push('');
  lines.push('## Repo Documentation Scores');
  lines.push('');
  lines.push('| Repo | Score | Language | Stars | Topics |');
  lines.push('|------|-------|----------|-------|--------|');
  for (const r of report.repos) {
    const marker = r.isEmpty ? ' (empty)' : '';
    lines.push(`| ${r.name}${marker} | ${r.docScore}/5 | ${r.language || '-'} | ${r.stars} | ${r.topics.join(', ') || '-'} |`);
  }
  lines.push('');

  return lines.join('\n');
}
