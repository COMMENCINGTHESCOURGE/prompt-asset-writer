#!/usr/bin/env node
import { Command } from 'commander';
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { writeAtomic } from './atomic-writer';
import { list, get } from './templates';
import type { TemplateInfo } from './templates';
import { validateData } from './validate';
import { analyze, formatReport } from './vinculum';
import { getConfig } from './config';
import { discover, formatEcosystemReport } from './ecosystem';
import type { EcosystemReport } from './ecosystem';

Handlebars.registerHelper('join', (arr: unknown[], sep: string) => {
  return Array.isArray(arr) ? arr.join(sep) : '';
});

const program = new Command();

function resolveData(raw: string): Record<string, unknown> {
  if (raw.startsWith('@')) {
    const filePath = raw.slice(1);
    return fs.readJsonSync(filePath);
  }
  return JSON.parse(raw);
}

program
  .name('prompt-asset-writer')
  .description('MANIFOLD documentation vinculum — generate, validate, and analyze ecosystem docs')
  .version('0.3.0');

program
  .command('generate')
  .description('Render a template to file')
  .requiredOption('-t, --template <name>', 'Template filename in templates/')
  .requiredOption('-o, --out <path>', 'Output file path')
  .option('-d, --data <json>', 'JSON data or @file.json', '{}')
  .option('--no-validate', 'Skip data validation')
  .action((opts: { template: string; out: string; data: string; validate: boolean }) => {
    const info = get(opts.template);
    if (!info) {
      console.error(`Template not found: ${opts.template}`);
      console.error(`Available templates: ${list().join(', ')}`);
      process.exit(1);
    }

    let context: Record<string, unknown>;
    try {
      context = resolveData(opts.data);
    } catch (e: unknown) {
      console.error(`Failed to parse data: ${(e as Error).message}`);
      process.exit(1);
    }

    if (opts.validate) {
      const result = validateData(info.metadata, context);
      if (!result.valid) {
        console.error('Validation failed:');
        for (const err of result.errors) console.error(`  ${err}`);
        process.exit(1);
      }
      for (const warn of result.warnings) console.warn(`  ${warn}`);
    }

    const output = Handlebars.compile(info.content)(context);
    writeAtomic(opts.out, output);
    console.log(`Wrote: ${opts.out}`);
  });

program
  .command('list')
  .description('List available templates')
  .action(() => {
    const templates = list();
    if (templates.length === 0) {
      console.log('No templates found.');
      return;
    }
    console.log('Available templates:');
    for (const t of templates) {
      const info = get(t);
      if (info && info.metadata.description) {
        console.log(`  ${t}  — ${info.metadata.description}`);
      } else {
        console.log(`  ${t}`);
      }
    }
  });

program
  .command('analyze')
  .description('Analyze a template through the vinculum lens')
  .requiredOption('-t, --template <name>', 'Template filename in templates/')
  .option('-d, --data <json>', 'JSON data or @file.json')
  .option('-o, --out <path>', 'Write analysis report to file')
  .action((opts: { template: string; data?: string; out?: string }) => {
    const info = get(opts.template);
    if (!info) {
      console.error(`Template not found: ${opts.template}`);
      console.error(`Available templates: ${list().join(', ')}`);
      process.exit(1);
    }

    let context: Record<string, unknown> | undefined;
    if (opts.data) {
      try {
        context = resolveData(opts.data);
      } catch (e: unknown) {
        console.error(`Failed to parse data: ${(e as Error).message}`);
        process.exit(1);
      }
    }

    const report = analyze(info, context);
    const formatted = formatReport(report);

    if (opts.out) {
      writeAtomic(opts.out, formatted);
      console.log(`Wrote: ${opts.out}`);
    } else {
      console.log(formatted);
    }
  });

program
  .command('validate')
  .description('Validate data against a template schema')
  .requiredOption('-t, --template <name>', 'Template filename in templates/')
  .requiredOption('-d, --data <json>', 'JSON data or @file.json')
  .action((opts: { template: string; data: string }) => {
    const info = get(opts.template);
    if (!info) {
      console.error(`Template not found: ${opts.template}`);
      console.error(`Available templates: ${list().join(', ')}`);
      process.exit(1);
    }

    let context: Record<string, unknown>;
    try {
      context = resolveData(opts.data);
    } catch (e: unknown) {
      console.error(`Failed to parse data: ${(e as Error).message}`);
      process.exit(1);
    }

    const result = validateData(info.metadata, context);

    if (result.valid) {
      console.log('Data is valid');
    } else {
      console.error('Validation failed:');
      for (const err of result.errors) console.error(`  ${err}`);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Scaffold a new template')
  .requiredOption('-n, --name <name>', 'Template filename (e.g. my-template.md.hbs)')
  .option('-d, --description <desc>', 'Template description', 'Custom template')
  .option('--dir <path>', 'Templates directory', 'templates')
  .action((opts: { name: string; description: string; dir: string }) => {
    const name = opts.name.endsWith('.hbs') ? opts.name : `${opts.name}.hbs`;
    const templatesDir = path.resolve(opts.dir);

    fs.ensureDirSync(templatesDir);
    const tmplPath = path.join(templatesDir, name);

    if (fs.existsSync(tmplPath)) {
      console.error(`Template already exists: ${tmplPath}`);
      process.exit(1);
    }

    const stub = `---
title: "{{title}}"
---

# {{title}}

## Section
{{content}}
`;

    fs.writeFileSync(tmplPath, stub, 'utf-8');
    console.log(`Created: ${tmplPath}`);

    const registryPath = path.join(templatesDir, 'template-metadata.json');
    let registry: Record<string, unknown> = {};
    if (fs.existsSync(registryPath)) {
      registry = fs.readJsonSync(registryPath);
    }

    const entry = {
      description: opts.description,
      variables: {
        title: { type: 'string', required: true, description: 'Document title' },
        content: { type: 'string', required: true, description: 'Main content' }
      },
      vinculum: {
        preserves: ['structured frontmatter', 'simple content section'],
        sacrifices: ['complex layout', 'multiple sections']
      }
    };

    registry[name] = entry;
    writeAtomic(registryPath, JSON.stringify(registry, null, 2) + '\n');
    console.log(`Updated: ${registryPath}`);
  });

program
  .command('info')
  .description('Show project info and template statistics')
  .action(() => {
    const pkg = fs.readJsonSync(path.join(__dirname, '..', 'package.json'));
    const templates = list();
    const totalVars = templates.reduce((sum, t) => {
      const info = get(t);
      return sum + (info ? Object.keys(info.metadata.variables).length : 0);
    }, 0);
    const requiredVars = templates.reduce((sum, t) => {
      const info = get(t);
      if (!info) return sum;
      return sum + Object.values(info.metadata.variables).filter(v => v.required).length;
    }, 0);

    console.log(`prompt-asset-writer v${pkg.version}`);
    console.log(`Description: ${pkg.description}`);
    console.log(`Templates: ${templates.length}`);
    console.log(`Total variables: ${totalVars} (${requiredVars} required)`);
    console.log(`License: ${pkg.license}`);
    console.log(`Node: ${pkg.engines.node}`);
    console.log('');

    const config = getConfig();
    if (Object.keys(config).length > 0) {
      console.log('Config (prompt-asset-writer.json):');
      for (const [k, v] of Object.entries(config)) {
        console.log(`  ${k}: ${v}`);
      }
    } else {
      console.log('No local config found.');
    }
  });

program
  .command('ecosystem')
  .description('Discover and analyze MANIFOLD ecosystem repos')
  .argument('[action]', 'Action: discover, generate, validate', 'discover')
  .option('-o, --owner <name>', 'GitHub owner', 'COMMENCINGTHESCOURGE')
  .option('-r, --report <path>', 'Write ecosystem report to file')
  .option('--outdir <path>', 'Output directory for generated docs', 'ecosystem-docs')
  .action(async (action: string, opts: { owner: string; report?: string; outdir: string }) => {
    const report = await discover(opts.owner);

    switch (action) {
      case 'discover': {
        const formatted = formatEcosystemReport(report);
        if (opts.report) {
          writeAtomic(opts.report, formatted);
          console.log(`Wrote: ${opts.report}`);
        } else {
          console.log(formatted);
        }
        break;
      }

      case 'generate': {
        const outdir = path.resolve(opts.outdir);
        fs.ensureDirSync(outdir);

        for (const repo of report.repos) {
          if (repo.isEmpty) continue;
          const readme = get('repo-readme.md.hbs')!;
          const context = {
            name: repo.name,
            owner: opts.owner,
            description: repo.description || `${repo.name} — part of the MANIFOLD ecosystem`,
            language: repo.language,
            topics: repo.topics,
            about: repo.description || `Part of the MANIFOLD field computation system.`,
            setup: ''
          };
          const output = Handlebars.compile(readme.content)(context);
          const outPath = path.join(outdir, `${repo.name}-README.md`);
          writeAtomic(outPath, output);
          console.log(`  Generated: ${outPath}`);
        }

        const vision = get('vision.md.hbs')!;
        const visionOut = Handlebars.compile(vision.content)({});
        writeAtomic(path.join(outdir, 'VISION.md'), visionOut);
        console.log(`  Generated: ${path.join(outdir, 'VISION.md')}`);

        const pkg = fs.readJsonSync(path.join(__dirname, '..', 'package.json'));
        const profile = get('profile-readme.md.hbs')!;
        const profileCtx = {
          totalRepos: report.totalRepos,
          languageCount: Object.keys(report.languages).length,
          documentedRepos: report.documentedRepos
        };
        const profileOut = Handlebars.compile(profile.content)(profileCtx);
        writeAtomic(path.join(outdir, 'PROFILE-README.md'), profileOut);
        console.log(`  Generated: ${path.join(outdir, 'PROFILE-README.md')}`);

        console.log(`\nDone. ${report.nonEmptyRepos} docs generated in ${outdir}`);
        break;
      }

      case 'validate': {
        const gaps: string[] = [];
        for (const repo of report.repos) {
          if (repo.isEmpty) continue;
          if (repo.docScore < 3) {
            gaps.push(`  ${repo.name}: score ${repo.docScore}/5 (missing ${!repo.description ? 'description ' : ''}${!repo.license ? 'license ' : ''}${repo.topics.length === 0 ? 'topics ' : ''})`);
          }
        }

        if (gaps.length === 0) {
          console.log(`All ${report.nonEmptyRepos} non-empty repos are well-documented (score >= 3).`);
        } else {
          console.log(`Documentation gaps found (${gaps.length} repos with score < 3):`);
          console.log('');
          for (const g of gaps) console.log(g);
        }
        break;
      }

      default:
        console.error(`Unknown action: ${action}. Use discover, generate, or validate.`);
        process.exit(1);
    }
  });

program.parse();
