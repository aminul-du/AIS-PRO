---
id: MCORE-DIR-SPECS
title: Specifications Directory Overview & Governance Authoring Guide
author_id: MCORE-FDR-AIS-001
status: active
domain_scope: isolated-mcore
quantization_profile: L0-Lossless
last_reviewed: 2026-11-19
---

# Specifications Directory (`specs/`)

**Authority:** Md. Aminul Islam ("Shamim") | `MCORE-FDR-AIS-001`
**Organization:** Meticulous Core Ltd. (MCore)
**Standard:** MDEA v1.0 Architectural Decision Record (ADR) Framework

---

## Purpose & Scope

The `specs/` directory is the canonical repository for all formal engineering standards, system specifications, and architectural contracts governing MCore platforms.

Every file in this directory represents **State 2 (Verified Spec / ADR)** or higher in the Specification Adoption Lifecycle.

## Master Specifications

* **`ADOPTION-AND-QUANTIZATION.md`**: Specification adoption lifecycle states (`Draft` -> `Verified` -> `Staging` -> `Production` -> `Archived`), ADR gating rules, and the L0–L2 quantization profiles matrix.
* **`STRICT-FABRIC.md`**: Strict fabric architecture, kernel namespace isolation (`mcore-ns`), domain scope boundaries (`general-ai-agi`, `isolated-mcore`, `isolated-shorborno`), and refusal-first ingress filters.

## Authoring Standards

All specifications must include:
1. Standardized YAML frontmatter (`id`, `title`, `author_id: MCORE-FDR-AIS-001`, `status`, `domain_scope`, `quantization_profile`, `last_reviewed`).
2. Quantization Profile set to `L0-Lossless` for governance/architecture specs.
3. Explicit threat and memory boundary assessment under PMICS.
4. Formal attribution to Founder Md. Aminul Islam ("Shamim") (`MCORE-FDR-AIS-001`).
