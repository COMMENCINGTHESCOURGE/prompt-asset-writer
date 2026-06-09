# Prompt Asset Writer — Architecture

## Overview

prompt-asset-writer is a text-only document generation tool. It renders Handlebars templates into structured markdown documents. Every document is a **vinculum** — a ratio between structured data and rendered output.

## Core Vinculum

```
    template + context
    ────────────────
    rendered document
```

- **Preserves**: Structured frontmatter, enumerated lists, consistent document shape
- **Sacrifices**: Free-form narrative, rich formatting, inline code/diagrams

## Module Map

```
CLI Layer
  cli.ts              — Commander-based CLI with 4 subcommands
  
Core Layer
  index.ts            — Public API surface (re-exports)
  templates.ts        — Template discovery + metadata registry
  validate.ts         — Schema validation (type checks, required fields)
  vinculum.ts         — Vinculum analysis engine (preserves/sacrifices reports)

I/O Layer
  atomic-writer.ts    — Temp-file + atomic rename writer (NTFS-safe)
```

## Data Flow

```
User CLI Input
  │
  ├─ list        → templates.ts:list() → console
  │
  ├─ validate    → templates.ts:get() + validate.ts:validateData() → console
  │
  ├─ analyze     → templates.ts:get() + vinculum.ts:analyze() → console/file
  │
  └─ generate    → templates.ts:get() + validate.ts:validateData()
                   → Handlebars.compile() → atomic-writer.ts:writeAtomic() → file
```

## Template Registry

`templates/template-metadata.json` declares per-template:
- `variables` — schema (type, required, description)
- `vinculum` — preserves/sacrifices tradeoffs

Templates are `.hbs` files discovered by scanning `templates/`.

## Atomic Writer

The `atomic-writer.ts` module writes files using a temp-file + rename strategy:

1. Write content to a temp file in `os.tmpdir()` with a random suffix
2. `fs.moveSync()` (atomic rename) to the target path

This prevents partial writes from corrupting output if the process crashes mid-write.
