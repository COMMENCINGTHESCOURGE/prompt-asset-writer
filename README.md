# prompt-asset-writer

**Part of the MANIFOLD prompt asset system.**
**Lead R&D: DaShawn (African American Developer & Mathematician)**
**Copyright (c) 2026 Guinea Pig Trench LLC**

---

Text-only: prompts, manifests, acceptance docs. No visuals, no audio, no network.

A TypeScript CLI tool for generating structured markdown documents from Handlebars templates. Each document is a vinculum — a ratio between structured data and rendered output, with explicit preserves/sacrifices per template.

## Architecture

### The Template Vinculum

```
    template + context
    ────────────────
    rendered document
```

Every template declares its variable schema and its vinculum tradeoffs in `templates/template-metadata.json`. The renderer validates data against the schema before writing, ensuring no malformed documents escape.

### Components

| Module | Purpose |
|--------|---------|
| `src/cli.ts` | CLI entry point — 4 commands: generate, list, analyze, validate |
| `src/index.ts` | Public API surface |
| `src/templates.ts` | Template registry — discovers `.hbs` files, loads metadata |
| `src/validate.ts` | Schema validator — checks types and required fields |
| `src/vinculum.ts` | Analysis engine — generates preserves/sacrifices reports |
| `src/atomic-writer.ts` | Thread-safe file writer — temp + atomic rename (NTFS-safe) |
| `templates/` | Handlebars templates + template-metadata.json registry |

### Templates

| Template | Description |
|----------|-------------|
| `prompt.md.hbs` | Standard prompt with frontmatter, requirements, acceptance criteria |
| `manifest.md.hbs` | Project manifest with scope, stakeholders, milestones |
| `acceptance.md.hbs` | Acceptance test document with test cases and sign-off |
| `changelog.md.hbs` | Changelog with version entries, changes, and contributors |

## Quick Start

```bash
git clone https://github.com/COMMENCINGTHESCOURGE/prompt-asset-writer.git
cd prompt-asset-writer
npm install
npm run build
```

### List available templates

```bash
node dist/cli.js list
```

### Generate a document

```bash
node dist/cli.js generate \
  -t prompt.md.hbs \
  -o ./output/my-prompt.md \
  -d '{"title":"Feature X","phase":"design","author":"dev","purpose":"Build X","requirements":["a","b"],"acceptance":["c","d"]}'
```

### Validate data against a template schema

```bash
node dist/cli.js validate \
  -t manifest.md.hbs \
  -d '{"title":"Proj","version":"1.0","author":"me","scope":"scope","stakeholders":["a"],"milestones":["m1"]}'
```

### Analyze a template through the vinculum lens

```bash
node dist/cli.js analyze -t prompt.md.hbs
```

### Skip validation on generate

```bash
node dist/cli.js generate -t prompt.md.hbs -o out.md -d '{...}' --no-validate
```

## Development

```bash
# Install
npm install

# Build
npm run build

# Test
npm test

# Type check
npx tsc --noEmit
```

## Acceptance Gates

Run the acceptance suite before publishing:

```bash
bash ACCEPTANCE.sh
```

## Deployment

- **npm**: `npm publish` (requires auth)
- **Docker**: `docker build -t prompt-asset-writer .`

## Entity

| Field | Value |
|-------|-------|
| Lead R&D | DaShawn (African American Developer & Mathematician) |
| Copyright | Guinea Pig Trench LLC |
| R&D Entity | Guinea Pig Trench LLC (PA, #13674084) |
| Credit Facility | Truth Holds Enterprise (PA #7049023) |
