---
title: "Reproduction Prompt: Basset: Learning the Regulatory Code"
type: "reproduction-prompt"
style: "technical"
---

# Reproduce: Basset: Learning the Regulatory Code

**Original Paper:** Kelley DR, Snoek J, Rinn JL. Genome Research 26(7):990-999 (2016)
**Year:** 2016
**Venue:** Genome Research
**Code Repo:** https://github.com/davek44/Basset
**Build Status:** BREACH - Torch7/Lua deprecated, luarocks missing
**Modern Successor:** calico/basenji (TensorFlow 2, active)

---

## Objective
Reproduce the core result: **CNN predicts chromatin accessibility from DNA sequence (AUROC 0.92+)**

Benchmark: AUROC on ENCODE/Roadmap DNase-seq on ENCODE + Epigenomics Roadmap compendium

---

## Environment Specification

```yaml
# Original (legacy)
original_env:
  framework: Torch7 (Lua)
  python: "N/A (Lua)"
  cuda: "7.5+"
  dependencies:
    - Torch7
    - luarocks
    - nn
    - cunn
    - cutorch
    - bedtools
    - pysam

# Modern (recommended)
modern_env:
  framework: "TensorFlow 2.x / Keras 3"
  python: "3.10+"
  cuda: "11.8+"
  dependencies:
    - tensorflow&gt;&#x3D;2.10
    - numpy
    - pandas
    - h5py
    - pybigwig
    - pysam
    - pybedtools
    - scikit-learn
```

---

## Data Requirements

| Dataset | Source | Size | Access |
|---------|--------|------|--------|
| ENCODE DNase-seq | https://encodeproject.org | ~2TB | Public |
| Roadmap Epigenomics | https://egg2.wustl.edu/roadmap | ~500GB | Public |

**Download commands:**
```bash
bash tutorials/prepare_compendium.ipynb
```

---

## Reproduction Steps

### 1. Environment Setup
```bash
# Modern stack (recommended)
conda create -n basset-repro python=3.10
conda activate basset-repro
pip install 
# or
conda env create -f environment.yml
```

### 2. Data Preparation
```bash
python src/preprocess_features.py --help
python src/seq_hdf5.py --help
```

### 3. Training
```bash
th src/basset_train.lua -data data/encode.h5 -model models/basset.t7
```
Expected time: ~3 days on 4x Titan X on 4x NVIDIA Titan X (12GB)
Checkpoints saved to: models/basset_epoch*.t7

### 4. Evaluation
```bash
th src/basset_test.lua -model models/basset_best.t7 -data data/test.h5
```
Expected metric: AUROC &gt; 0.90 on held-out cell types

### 5. Visualization / Analysis
```bash
python src/basset_motifs.py models/basset_best.t7
python src/basset_sat.py models/basset_best.t7 data/test.h5
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

- **Torch7 unavailable**: Torch7 deprecated 2018, no binary for Python 3.10+
  - Fix: Migrate to calico/basenji (TF2) or retrain in PyTorch
- **Data URLs rotated**: ENCODE/Roadmap URLs changed, tutorial notebooks broken
  - Fix: Use basenji/data/ download scripts

---

## Modern Alternatives

| Model | Repo | Framework | Advantage |
|-------|------|-----------|-----------|
| Basenji | calico/basenji | TensorFlow 2 | Active, regression not classification, chromosome-scale |
| Enformer | deepmind/enformer | TensorFlow/JAX | 200kb context, cross-species, human+mouse |
| Borzoi | kuleshov-group/borzoi | JAX | Faster, scalable, multi-omics |
| Sei | kundajelab/Sei | PyTorch | Sequence-effect interpretation, 21k traits |

---

## References

- Original: https://genome.cshlp.org/content/26/7/990
- Code: https://github.com/davek44/Basset
- Modern: https://github.com/calico/basenji,https://github.com/deepmind/enformer,https://github.com/kuleshov-group/borzoi,https://github.com/kundajelab/Sei