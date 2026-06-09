#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const handlebars_1 = __importDefault(require("handlebars"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const atomic_writer_1 = require("./atomic-writer");
const templates_1 = require("./templates");
const validate_1 = require("./validate");
const vinculum_1 = require("./vinculum");
const config_1 = require("./config");
const ecosystem_1 = require("./ecosystem");
handlebars_1.default.registerHelper('join', (arr, sep) => {
    return Array.isArray(arr) ? arr.join(sep) : '';
});
const program = new commander_1.Command();
function resolveData(raw) {
    if (raw.startsWith('@')) {
        const filePath = raw.slice(1);
        return fs_extra_1.default.readJsonSync(filePath);
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
    .action((opts) => {
    const info = (0, templates_1.get)(opts.template);
    if (!info) {
        console.error(`Template not found: ${opts.template}`);
        console.error(`Available templates: ${(0, templates_1.list)().join(', ')}`);
        process.exit(1);
    }
    let context;
    try {
        context = resolveData(opts.data);
    }
    catch (e) {
        console.error(`Failed to parse data: ${e.message}`);
        process.exit(1);
    }
    if (opts.validate) {
        const result = (0, validate_1.validateData)(info.metadata, context);
        if (!result.valid) {
            console.error('Validation failed:');
            for (const err of result.errors)
                console.error(`  ${err}`);
            process.exit(1);
        }
        for (const warn of result.warnings)
            console.warn(`  ${warn}`);
    }
    const output = handlebars_1.default.compile(info.content)(context);
    (0, atomic_writer_1.writeAtomic)(opts.out, output);
    console.log(`Wrote: ${opts.out}`);
});
program
    .command('list')
    .description('List available templates')
    .action(() => {
    const templates = (0, templates_1.list)();
    if (templates.length === 0) {
        console.log('No templates found.');
        return;
    }
    console.log('Available templates:');
    for (const t of templates) {
        const info = (0, templates_1.get)(t);
        if (info && info.metadata.description) {
            console.log(`  ${t}  — ${info.metadata.description}`);
        }
        else {
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
    .action((opts) => {
    const info = (0, templates_1.get)(opts.template);
    if (!info) {
        console.error(`Template not found: ${opts.template}`);
        console.error(`Available templates: ${(0, templates_1.list)().join(', ')}`);
        process.exit(1);
    }
    let context;
    if (opts.data) {
        try {
            context = resolveData(opts.data);
        }
        catch (e) {
            console.error(`Failed to parse data: ${e.message}`);
            process.exit(1);
        }
    }
    const report = (0, vinculum_1.analyze)(info, context);
    const formatted = (0, vinculum_1.formatReport)(report);
    if (opts.out) {
        (0, atomic_writer_1.writeAtomic)(opts.out, formatted);
        console.log(`Wrote: ${opts.out}`);
    }
    else {
        console.log(formatted);
    }
});
program
    .command('validate')
    .description('Validate data against a template schema')
    .requiredOption('-t, --template <name>', 'Template filename in templates/')
    .requiredOption('-d, --data <json>', 'JSON data or @file.json')
    .action((opts) => {
    const info = (0, templates_1.get)(opts.template);
    if (!info) {
        console.error(`Template not found: ${opts.template}`);
        console.error(`Available templates: ${(0, templates_1.list)().join(', ')}`);
        process.exit(1);
    }
    let context;
    try {
        context = resolveData(opts.data);
    }
    catch (e) {
        console.error(`Failed to parse data: ${e.message}`);
        process.exit(1);
    }
    const result = (0, validate_1.validateData)(info.metadata, context);
    if (result.valid) {
        console.log('Data is valid');
    }
    else {
        console.error('Validation failed:');
        for (const err of result.errors)
            console.error(`  ${err}`);
        process.exit(1);
    }
});
program
    .command('init')
    .description('Scaffold a new template')
    .requiredOption('-n, --name <name>', 'Template filename (e.g. my-template.md.hbs)')
    .option('-d, --description <desc>', 'Template description', 'Custom template')
    .option('--dir <path>', 'Templates directory', 'templates')
    .action((opts) => {
    const name = opts.name.endsWith('.hbs') ? opts.name : `${opts.name}.hbs`;
    const templatesDir = path_1.default.resolve(opts.dir);
    fs_extra_1.default.ensureDirSync(templatesDir);
    const tmplPath = path_1.default.join(templatesDir, name);
    if (fs_extra_1.default.existsSync(tmplPath)) {
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
    fs_extra_1.default.writeFileSync(tmplPath, stub, 'utf-8');
    console.log(`Created: ${tmplPath}`);
    const registryPath = path_1.default.join(templatesDir, 'template-metadata.json');
    let registry = {};
    if (fs_extra_1.default.existsSync(registryPath)) {
        registry = fs_extra_1.default.readJsonSync(registryPath);
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
    (0, atomic_writer_1.writeAtomic)(registryPath, JSON.stringify(registry, null, 2) + '\n');
    console.log(`Updated: ${registryPath}`);
});
program
    .command('info')
    .description('Show project info and template statistics')
    .action(() => {
    const pkg = fs_extra_1.default.readJsonSync(path_1.default.join(__dirname, '..', 'package.json'));
    const templates = (0, templates_1.list)();
    const totalVars = templates.reduce((sum, t) => {
        const info = (0, templates_1.get)(t);
        return sum + (info ? Object.keys(info.metadata.variables).length : 0);
    }, 0);
    const requiredVars = templates.reduce((sum, t) => {
        const info = (0, templates_1.get)(t);
        if (!info)
            return sum;
        return sum + Object.values(info.metadata.variables).filter(v => v.required).length;
    }, 0);
    console.log(`prompt-asset-writer v${pkg.version}`);
    console.log(`Description: ${pkg.description}`);
    console.log(`Templates: ${templates.length}`);
    console.log(`Total variables: ${totalVars} (${requiredVars} required)`);
    console.log(`License: ${pkg.license}`);
    console.log(`Node: ${pkg.engines.node}`);
    console.log('');
    const config = (0, config_1.getConfig)();
    if (Object.keys(config).length > 0) {
        console.log('Config (prompt-asset-writer.json):');
        for (const [k, v] of Object.entries(config)) {
            console.log(`  ${k}: ${v}`);
        }
    }
    else {
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
    .action(async (action, opts) => {
    const report = await (0, ecosystem_1.discover)(opts.owner);
    switch (action) {
        case 'discover': {
            const formatted = (0, ecosystem_1.formatEcosystemReport)(report);
            if (opts.report) {
                (0, atomic_writer_1.writeAtomic)(opts.report, formatted);
                console.log(`Wrote: ${opts.report}`);
            }
            else {
                console.log(formatted);
            }
            break;
        }
        case 'generate': {
            const outdir = path_1.default.resolve(opts.outdir);
            fs_extra_1.default.ensureDirSync(outdir);
            for (const repo of report.repos) {
                if (repo.isEmpty)
                    continue;
                const readme = (0, templates_1.get)('repo-readme.md.hbs');
                const context = {
                    name: repo.name,
                    owner: opts.owner,
                    description: repo.description || `${repo.name} — part of the MANIFOLD ecosystem`,
                    language: repo.language,
                    topics: repo.topics,
                    about: repo.description || `Part of the MANIFOLD field computation system.`,
                    setup: ''
                };
                const output = handlebars_1.default.compile(readme.content)(context);
                const outPath = path_1.default.join(outdir, `${repo.name}-README.md`);
                (0, atomic_writer_1.writeAtomic)(outPath, output);
                console.log(`  Generated: ${outPath}`);
            }
            const vision = (0, templates_1.get)('vision.md.hbs');
            const visionOut = handlebars_1.default.compile(vision.content)({});
            (0, atomic_writer_1.writeAtomic)(path_1.default.join(outdir, 'VISION.md'), visionOut);
            console.log(`  Generated: ${path_1.default.join(outdir, 'VISION.md')}`);
            const pkg = fs_extra_1.default.readJsonSync(path_1.default.join(__dirname, '..', 'package.json'));
            const profile = (0, templates_1.get)('profile-readme.md.hbs');
            const profileCtx = {
                totalRepos: report.totalRepos,
                languageCount: Object.keys(report.languages).length,
                documentedRepos: report.documentedRepos
            };
            const profileOut = handlebars_1.default.compile(profile.content)(profileCtx);
            (0, atomic_writer_1.writeAtomic)(path_1.default.join(outdir, 'PROFILE-README.md'), profileOut);
            console.log(`  Generated: ${path_1.default.join(outdir, 'PROFILE-README.md')}`);
            console.log(`\nDone. ${report.nonEmptyRepos} docs generated in ${outdir}`);
            break;
        }
        case 'validate': {
            const gaps = [];
            for (const repo of report.repos) {
                if (repo.isEmpty)
                    continue;
                if (repo.docScore < 3) {
                    gaps.push(`  ${repo.name}: score ${repo.docScore}/5 (missing ${!repo.description ? 'description ' : ''}${!repo.license ? 'license ' : ''}${repo.topics.length === 0 ? 'topics ' : ''})`);
                }
            }
            if (gaps.length === 0) {
                console.log(`All ${report.nonEmptyRepos} non-empty repos are well-documented (score >= 3).`);
            }
            else {
                console.log(`Documentation gaps found (${gaps.length} repos with score < 3):`);
                console.log('');
                for (const g of gaps)
                    console.log(g);
            }
            break;
        }
        default:
            console.error(`Unknown action: ${action}. Use discover, generate, or validate.`);
            process.exit(1);
    }
});
program.parse();
