#!/usr/bin/env node
/**
 * EXPORT TO JSONL — Convert generated documents to JSONL format.
 * Usage: node dist/scripts/export-jsonl.js -i <input-dir> -o <output.jsonl>
 */
import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';
import { writeAtomic } from '../atomic-writer';

const program = new Command();

program
  .name('export-jsonl')
  .description('Export markdown documents to JSONL format')
  .requiredOption('-i, --input <dir>', 'Input directory with .md files')
  .requiredOption('-o, --output <path>', 'Output JSONL file path')
  .action((opts: { input: string; output: string }) => {
    const dir = path.resolve(opts.input);
    if (!fs.existsSync(dir)) {
      console.error(`Input directory not found: ${dir}`);
      process.exit(1);
    }

    const files = fs.readdirSync(dir).filter(f => f.endsWith('.md'));
    const records: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      const record = JSON.stringify({
        filename: file,
        content,
        generated: new Date().toISOString()
      });
      records.push(record);
    }

    writeAtomic(opts.output, records.join('\n') + '\n');
    console.log(`Exported ${records.length} records to ${opts.output}`);
  });

program.parse();
