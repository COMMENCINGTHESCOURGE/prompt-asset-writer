---
title: "Reproduction Prompt: ADAGE: Denoising Autoencoders for Gene Expression"
type: "reproduction-prompt"
style: "technical"
---

# Reproduce: ADAGE: Denoising Autoencoders for Gene Expression

**Original Paper:** Tan J, Hammond JH, Hogan DA, Greene CS. mSystems 1(1):e00025-15 (2016)
**Year:** 2016
**Venue:** mSystems
**Code Repo:** https://github.com/greenelab/adage
**Build Status:** BREACH - Theano dead, Python 2, docopt incompatible
**Modern Successor:** scVI (PyTorch), Geneformer (PyTorch), scGPT (PyTorch)

---

## Objective
Reproduce the core result: **Denoising autoencoder compresses 1000+ Pseudomonas expression samples into 50 latent features capturing biological signal**

Benchmark: Pathway recovery, gene-gene correlation, microbe-host interaction discovery on Pseudomonas aeruginosa compendium (800+ samples)

---

## Environment Specification

```yaml
# Original (legacy)
original_env:
  framework: Theano + Python 2.7
  python: "2.7"
  cuda: "Optional"
  dependencies:
    - Theano
    - docopt
    - numpy
    - scipy
    - pandas
    - scikit-learn

# Modern (recommended)
modern_env:
  framework: "PyTorch 2.x / scvi-tools"
  python: "3.10+"
  cuda: "11.8+"
  dependencies:
    - torch&gt;&#x3D;2.0
    - scvi-tools
    - scanpy
    - anndata
    - numpy
    - pandas
    - scikit-learn
```

---

## Data Requirements

| Dataset | Source | Size | Access |
|---------|--------|------|--------|
| Pa_compendium | GEO / Pseudomonas Genome DB | ~2GB | Public |

**Download commands:**
```bash
python Data_collection_processing/zero_one_normalization.py Data_collection_processing/Pa_compendium_02.22.2014.pcl Train_test_DAs/train_set_normalized.pcl None
```

---

## Reproduction Steps

### 1. Environment Setup
```bash
# Modern stack (recommended)
conda create -n adage-repro python=3.10
conda activate adage-repro
pip install 
# or
conda env create -f environment.yml
```

### 2. Data Preparation
```bash
# 0-1 normalization required before training
```

### 3. Training
```bash
python Train_test_DAs/SdA_train.py Train_test_DAs/train_set_normalized.pcl --parameters
```
Expected time: Hours on CPU (no GPU required for shallow AE) on Optional
Checkpoints saved to: Train_test_DAs/model.pkl

### 4. Evaluation
```bash
python Train_test_DAs/SdA_test.py Train_test_DAs/Genome-hybs_normalized.pcl --parameters
```
Expected metric: Pathway enrichment in latent features, known interactions recovered

### 5. Visualization / Analysis
```bash
python Gene-gene_function/analyze_features.py
python Node_interpretation/interpret_nodes.py
```

---

## Vinculum Verification Checklist

- [ ] **GOVERNOR**: Code builds from source
- [ ] **GOVERNOR**: Benchmark reproduces within 5% of paper
- [ ] **GOVERNOR**: Pre-trained weights load and infer
- [ ] **GAUGE**: Paper metrics plausible but unverified
- [ ] **BREACH**: Framework dead / build fails / data unavailable

---

## Known Issues / Workarounds

- **Theano dead**: Theano ceased 2021, no modern Python support
  - Fix: Port to PyTorch Lightning + scvi-tools
- **Python 2 only**: print statements, cPickle, urllib2
  - Fix: Full Python 3 migration
- **docopt version conflict**: docopt 0.6.2+ breaks argument parsing
  - Fix: Pin docopt&#x3D;&#x3D;0.5.0 or use argparse
- **Hardcoded paths**: Scripts assume specific directory structure
  - Fix: Use config files / argparse

---

## Modern Alternatives

| Model | Repo | Framework | Advantage |
|-------|------|-----------|-----------|
| scVI | scverse/scvi-tools | PyTorch | Probabilistic VAE, scalable, handles batch effects |
| Geneformer | ctb/Geneformer | PyTorch | Transformer on 30M single cells, few-shot |
| scGPT | bowang-lab/scGPT | PyTorch | Generative pre-training, multi-task |
| scFoundation | ZJUFutureLab/scFoundation | PyTorch | 100M cell foundation model |

---

## References

- Original: https://msystems.asm.org/content/1/1/e00025-15
- Code: https://github.com/greenelab/adage
- Modern: https://github.com/scverse/scvi-tools,https://github.com/ctb/Geneformer,https://github.com/bowang-lab/scGPT