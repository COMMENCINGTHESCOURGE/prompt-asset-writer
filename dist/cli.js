"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const program = new commander_1.Command();
program
    .name('prompt-asset-writer')
    .description('Generate prompts, manifests, and acceptance docs from templates')
    .version('0.1.0');
program
    .command('generate')
    .description('Render a template to file')
    .requiredOption('-t, --template <name>', 'Template filename in templates/')
    .requiredOption('-o, --out <path>', 'Output file path')
    .option('-d, --data <json>', 'JSON data for template', '{}')
    .action((opts) => {
    const templatePath = path_1.default.join(__dirname, '..', 'templates', opts.template);
    if (!fs_extra_1.default.existsSync(templatePath)) {
        console.error(`Template not found: ${opts.template}`);
        process.exit(1);
    }
    const template = fs_extra_1.default.readFileSync(templatePath, 'utf-8');
    const context = JSON.parse(opts.data);
    const Handlebars = require('handlebars');
    const output = Handlebars.compile(template)(context);
    fs_extra_1.default.ensureDirSync(path_1.default.dirname(opts.out));
    fs_extra_1.default.writeFileSync(opts.out, output);
    console.log(`Wrote: ${opts.out}`);
});
program.parse();
