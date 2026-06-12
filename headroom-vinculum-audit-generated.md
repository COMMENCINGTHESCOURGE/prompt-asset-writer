---
title: "Vinculum Audit Report Generator"
type: "audit-report"
style: "technical"
---

#  - Vinculum Audit Report

## Target
**Repo:** https://github.com/chopratejas/headroom
**Commit:** HEAD
**Auditor:** vinculum-self-audit v0.1.0-alpha

## Methodology
Deletion-test verification: Every claim in documentation traced to ground truth in:
1. Benchmark suite definitions (code)
2. Dataset ground truth (HF dataset sources + answer fields)
3. Code existence verification (grep for implementations)

## Classification Criteria

| Label | Definition |
|-------|------------|
| **GOVERNOR** | Claim verified against source code / ground truth data |
| **GAUGE** | Claim plausible but uses different metrics / not reproducible |
| **BREACH** | Claim contradicted by evidence or unfalsifiable |

## Mod9 × CHROMA CASCADE Classification

```
mod9 = 0 (CHROMA INFRARED) → Self-destructive / contradictory claims
mod9 = 3,6 (BREACH corridors) → x3 universal breach detector triggered
mod9 = 1,2,4,5,7,8 → Standard verification corridors
```

## Audit Results Summary

| Category | Claims | GOVERNOR | GAUGE | BREACH |
|----------|--------|----------|-------|--------|
| README Token Savings | 4 | 0 | 4 | 0 |
| README Accuracy Benchmarks | 4 | 0 | 4 | 0 |
| Benchmark Suite Definitions | 8 | 8 | 0 | 0 |

## Detailed Findings

### README Token Savings

**Claim 1:** Code search: 17,765 → 1,408 tokens (92% savings)
- **Source:** README.md L110
- **Verification:** No benchmark named Code search in suite. Closest: CodeSearchNet (Tier 2, n&#x3D;50)
- **Status:** GAUGE
- **Evidence:** suite_runner.py has no Code search benchmark
**Claim 2:** SRE incident debugging: 65,694 → 5,118 tokens (92% savings)
- **Source:** README.md L111
- **Verification:** No SRE incident benchmark in suite
- **Status:** GAUGE
- **Evidence:** suite_runner.py benchmarks are standard NLP tasks
**Claim 3:** GitHub issue triage: 54,174 → 14,761 tokens (73% savings)
- **Source:** README.md L112
- **Verification:** No GitHub triage benchmark in suite
- **Status:** GAUGE
- **Evidence:** suite_runner.py uses standardized datasets
**Claim 4:** Codebase exploration: 78,502 → 41,254 tokens (47% savings)
- **Source:** README.md L113
- **Verification:** No Codebase exploration benchmark in suite
- **Status:** GAUGE
- **Evidence:** suite_runner.py uses different workload names

### README Accuracy Benchmarks

**Claim 1:** GSM8K: 0.870 → 0.870 (±0.000)
- **Source:** README.md L119
- **Verification:** Benchmark exists in Tier 1 suite, runner&#x3D;lm_eval
- **Status:** GAUGE
- **Evidence:** suite_runner.py:62-70 defines GSM8K spec
**Claim 2:** TruthfulQA: 0.530 → 0.560 (+0.030)
- **Source:** README.md L120
- **Verification:** Benchmark exists in Tier 1 suite, runner&#x3D;lm_eval
- **Status:** GAUGE
- **Evidence:** suite_runner.py:72-80 defines TruthfulQA spec
**Claim 3:** SQuAD v2: 97% accuracy (19% compression)
- **Source:** README.md L121
- **Verification:** Benchmark exists, but suite uses accuracy_preservation_rate metric
- **Status:** GAUGE
- **Evidence:** suite_runner.py:112-122 uses before_after runner
**Claim 4:** BFCL: 97% ground truth (32% compression)
- **Source:** README.md L122
- **Verification:** Benchmark exists, but suite uses ground_truth_match metric
- **Status:** GAUGE
- **Evidence:** suite_runner.py:124-135 uses ground_truth eval_mode

## Required Actions for GOVERNOR Upgrade

- [ ] **Export workload telemetry for Code Search** → Creates `data/workloads/code_search.json`
- [ ] **Export workload telemetry for SRE Debugging** → Creates `data/workloads/sre_debugging.json`
- [ ] **Export workload telemetry for GitHub Triage** → Creates `data/workloads/github_triage.json`
- [ ] **Export workload telemetry for Codebase Exploration** → Creates `data/workloads/codebase_exploration.json`
- [ ] **Add README → Suite mapping doc** → Creates `docs/benchmark-mapping.md`
- [ ] **Publish Tier 1 benchmark results** → Creates `reports/tier1-results.json`

## Vinculum Verdict

**Overall:** GAUGE — Benchmark infrastructure solid (GOVERNOR), but README claims use different metrics and workload names than reproducible suite

## Recommendation

Complete 6 telemetry exports to upgrade README claims from GAUGE to GOVERNOR. Run Tier 1 suite with API keys to publish verified results.