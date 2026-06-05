import { Command } from 'commander';
import fs from 'fs-extra';
import path from 'path';

const program = new Command();

program
  .name('prompt-asset-writer')
  .description('Generate prompts, manifests, and acceptance docs from templates')
  .version('0.1.0');

interface GenerateOptions {
  template: string;
  out: string;
  data: string;
}

program
  .command('generate')
  .description('Render a template to file')
  .requiredOption('-t, --template <name>', 'Template filename in templates/')
  .requiredOption('-o, --out <path>', 'Output file path')
  .option('-d, --data <json>', 'JSON data for template', '{}')
  .action((opts: GenerateOptions) => {
    const templatePath = path.join(__dirname, '..', 'templates', opts.template);
    if (!fs.existsSync(templatePath)) {
      console.error(`Template not found: ${opts.template}`);
      process.exit(1);
    }
    const template = fs.readFileSync(templatePath, 'utf-8');
    const context = JSON.parse(opts.data);
    const Handlebars = require('handlebars');
    const output = Handlebars.compile(template)(context);
    fs.ensureDirSync(path.dirname(opts.out));
    fs.writeFileSync(opts.out, output);
    console.log(`Wrote: ${opts.out}`);
  });

program.parse();
