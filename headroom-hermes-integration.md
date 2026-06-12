---
title: "Headroom-Hermes Integration Spec"
type: "integration-spec"
style: "technical"
---

#  Integration Specification

## Overview
Integrate **Headroom** (context compression layer) with **Hermes Agent** to enable:
- Token compression for all agent interactions (60-95% reduction)
- Cross-agent shared context via Qdrant backend
- Reversible compression (CCR) for on-demand retrieval
- Auto-compression hooks at token thresholds
- `headroom learn` → SOUL.md feedback loop

## Architecture

### Integration Modes

| Mode | Implementation | Use Case |
|------|---------------|----------|
| **Proxy** | `headroom proxy --port 8787` | Drop-in, zero code changes |
| **MCP Server** | `headroom mcp run` | Native Hermes tools: `headroom_compress`, `headroom_retrieve`, `headroom_stats` |
| **Agent Wrap** | `headroom wrap claude\|codex\|aider` | Wrap coding agents with compression |
| **Library** | `from headroom import compress` | Inline Python/TypeScript |
| **Hook** | `headroom_auto_compress` | Hermes pre-tool hook |

### Data Flow
```
User Query → Hermes Context → [headroom_auto_compress hook] → Compressed Context → Model
                    ↓
            CCR Store (local SQLite/Qdrant)
                    ↓
            headroom_retrieve (on demand)
```

## Hermes Config (config.yaml)

```yaml
mcp:
  servers:
    headroom:
      command: ["headroom", "mcp", "run"]
      env:
        HEADROOM_DEFAULT_MODEL: "gpt-4o-mini"
        HEADROOM_PROXY_PORT: "8787"
        HEADROOM_CCR_BACKEND: "sqlite"
        HEADROOM_CCR_PATH: "~/.headroom/ccr.db"
        HEADROOM_QDRANT_URL: "http://localhost:6333"
      allowed_tools: ["headroom_compress", "headroom_retrieve", "headroom_stats", "headroom_auto_compress"]

hooks:
  pre_tool:
    - headroom_auto_compress
  post_tool:
    - headroom_track_stats

hook_config:
  headroom_auto_compress:
    threshold_tokens: 80000
    model: "gpt-4o-mini"
    fail_open: true
    compress_roles: ["user", "assistant"]
  
  headroom_track_stats:
    log_to_session: true
    log_file: "~/.hermes/logs/headroom_stats.jsonl"
```

## Required Environment (.env)

```bash
# Headroom
HEADROOM_PROXY_PORT=8787
HEADROOM_DEFAULT_MODEL=gpt-4o-mini
HEADROOM_CCR_BACKEND=sqlite
HEADROOM_CCR_PATH=~/.headroom/ccr.db
HEADROOM_QDRANT_URL=http://localhost:6333

# LLM Providers (at least one required for benchmarks)
OPENAI_API_KEY=***
ANTHROPIC_API_KEY=***
# or
OPENROUTER_API_KEY=***
```

## MCP Tools Exposed to Hermes

| Tool | Parameters | Returns |
|------|------------|---------|
| `headroom_compress` | `messages: Message[], model?: string, threshold?: number` | `{ compressed: Message[], stats: CompressionStats, ccr_ids: string[] }` |
| `headroom_retrieve` | `ccr_ids: string[]` | `{ retrieved: { ccr_id: string, content: any, found: boolean }[] }` |
| `headroom_stats` | `{}` | `{ storage: Stats, memory: Stats, session: Stats }` |
| `headroom_auto_compress` | `messages: Message[], model?: string, threshold?: number` | `{ messages: Message[], compressed: boolean, stats: CompressionStats }` |

## Benchmarks (from Headroom)

| Benchmark | Baseline | Headroom | Delta | Compression |
|-----------|----------|----------|-------|-------------|
| GSM8K | 0.870 | 0.870 | ±0.000 | — |
| TruthfulQA | 0.530 | 0.560 | +0.030 | — |
| SQuAD v2 | — | 97% | — | 19% |
| BFCL | — | 97% | — | 32% |
| CCR Round-trip | 100% | 100% | 0% | 0% (lossless) |

Run: `python -m headroom.evals suite --tier 1 --model gpt-4o-mini`

## Vinculum Audit Status

- Benchmark suite definitions: **GOVERNOR** (8/8 verified in code)
- Dataset ground truth: **GOVERNOR** (7/7 HF datasets with answers)
- README token savings: **GAUGE** (real workload telemetry, not reproducible)
- README accuracy: **GAUGE** (metrics differ from suite)
- Code verification: **GOVERNOR** (CCR, SmartCrusher, CodeCompressor exist)

See: `headroom-vinculum-audit.md`

## Success Criteria

- [ ] `headroom proxy` runs and proxies requests
- [ ] `hermes tools` lists `headroom_*` tools
- [ ] Context >80k tokens auto-compresses before tool calls
- [ ] `headroom_retrieve` restores originals from CCR IDs
- [ ] `headroom learn` updates SOUL.md after failed sessions
- [ ] Cross-agent memory works via `SharedContext.put/get`
- [ ] Tier 1 benchmarks run and match published results

## Implementation Steps

1. `pip install "headroom-ai[all]"`
2. `headroom mcp install`
3. Add MCP config to `~/.hermes/config.yaml`
4. Add hooks to `~/.hermes/config.yaml`
5. Set API keys in `~/.hermes/.env`
6. Test: `hermes tools | grep headroom`
7. Test: `headroom proxy --port 8787` + Hermes request
8. Run benchmarks: `python -m headroom.evals suite --tier 1`