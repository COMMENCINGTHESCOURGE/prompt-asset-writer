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
  .description('Generate prompts, manifests, and acceptance docs from templates')
  .version('0.2.0');

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

program.parse();
