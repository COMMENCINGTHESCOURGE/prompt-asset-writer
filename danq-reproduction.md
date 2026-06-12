---
title: "Reproduction Prompt: DanQ: Hybrid CNN+RNN for DNA Function"
type: "reproduction-prompt"
style: "technical"
---

# Reproduce: DanQ: Hybrid CNN+RNN for DNA Function

**Original Paper:** Quang D, Xie X. NAR 44(11):e107 (2016)
**Year:** 2016
**Venue:** Nucleic Acids Research
**Code Repo:** https://github.com/uci-cbcl/DanQ
**Build Status:** BREACH - Theano dead, Keras 0.2, Python 2 syntax
**Modern Successor:** Sei (PyTorch), Enformer (TF/JAX), Basenji (TF2)

---

## Objective
Reproduce the core result: **CNN+BiLSTM predicts TF binding + histone marks from sequence (AUROC 0.93 vs DeepSEA 0.90)**

Benchmark: AUROC/AUPRC on 919 TF/histone tasks on DeepSEA benchmark (1000bp windows)

---

## Environment Specification

```yaml
# Original (legacy)
original_env:
  framework: Theano + Keras 0.2
  python: "2.7.10"
  cuda: "6.5"
  dependencies:
    - Theano (git master)
    - Keras 0.2.0
    - seya (modified)
    - h5py
    - numpy
    - scipy

# Modern (recommended)
modern_env:
  framework: "PyTorch 2.x / TensorFlow 2.x"
  python: "3.10+"
  cuda: "11.8+"
  dependencies:
    - torch&gt;&#x3D;2.0
    - torchvision
    - numpy
    - h5py
    - pybigwig
    - pysam
```

---

## Data Requirements

| Dataset | Source | Size | Access |
|---------|--------|------|--------|
| DeepSEA train/valid/test | http://deepsea.princeton.edu | ~50GB | Public |

**Download commands:**
```bash
wget http://deepsea.princeton.edu/media/code/deepsea_train_bundle.v0.9.tar.gz
tar xzf deepsea_train_bundle.v0.9.tar.gz
mv *.mat data/
```

---

## Reproduction Steps

### 1. Environment Setup
```bash
# Modern stack (recommended)
conda create -n danq-repro python=3.10
conda activate danq-repro
pip install 
# or
conda env create -f environment.yml
```

### 2. Data Preparation
```bash
# Data already in .mat format for Theano/Keras
```

### 3. Training
```bash
python DanQ_train.py
```
Expected time: ~6 hours/epoch on Titan Z on NVIDIA Titan Z (12GB x2)
Checkpoints saved to: DanQ_bestmodel.hdf5

### 4. Evaluation
```bash
python DanQ_test.py data/example.h5 data/pred.h5
```
Expected metric: AUROC &gt; 0.90 on 919 tasks

### 5. Visualization / Analysis
```bash
# Motifs in motifs/ folder
# TOMTOM comparisons to JASPAR
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

- **Theano dead**: Theano development ceased 2021, no Python 3.8+ support
  - Fix: Port to PyTorch/JAX or use Sei/Enformer
- **Keras 0.2 API incompatible**: Keras 3.x API completely different
  - Fix: Rewrite model in modern Keras 3 or PyTorch
- **Python 2 syntax**: print statements, xrange, etc.
  - Fix: 2to3 conversion + dependency updates
- **seya modified**: Custom fork of abandoned library included as tar.gz
  - Fix: Reimplement attention in native framework

---

## Modern Alternatives

| Model | Repo | Framework | Advantage |
|-------|------|-----------|-----------|
| Sei | kundajelab/Sei | PyTorch | 21k chromatin profiles, sequence-effect interpretation |
| Enformer | deepmind/enformer | TensorFlow/JAX | 200kb receptive field, human+mouse |
| Basenji | calico/basenji | TensorFlow 2 | Chromosome-scale, active development |
| BPNet | undrdev/BPNet | PyTorch | Base-resolution, interpretable |

---

## References

- Original: https://academic.oup.com/nar/article/44/11/e107/2460164
- Code: https://github.com/uci-cbcl/DanQ
- Modern: https://github.com/kundajelab/Sei,https://github.com/deepmind/enformer,https://github.com/calico/basenji