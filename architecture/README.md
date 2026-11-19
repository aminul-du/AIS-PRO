---
id: MCORE-DIR-ARCH
title: Architecture Directory Overview & System Design Standards
author_id: MCORE-FDR-AIS-001
status: active
domain_scope: isolated-mcore
quantization_profile: L0-Lossless
last_reviewed: 2026-11-19
---

# Architecture Directory (`architecture/`)

**Authority:** Md. Aminul Islam ("Shamim") | `MCORE-FDR-AIS-001`  
**Organization:** Meticulous Core Ltd. (MCore)  
**Reference Blueprint:** MDEA (`#MCORE-MEAR-001`)  

---

## Purpose & Scope

The `architecture/` directory maintains system-level designs, infrastructure topologies, execution runtime blueprints, and production deployment models across MCore.

Every architectural blueprint adheres to the Master Digital Enterprise Architecture (MDEA) and enforces pure Linux kernel execution, strict network namespace isolation, and zero-secret credentials.

## Key Assets

* **`STAGE-360-DRIVE.md`**: Cryptographic staging pipeline connecting cloud drive mounts (`/content/drive`), Python 3.14 sandboxes, and 10-file evidence bundles.
* **Network & Fabric Blueprints**: WSL-devNet dual-distro routing and Cloudflare Tunnel egress architectures.
* **Runtime Topologies**: Gemini Enterprise Agent Platform Memory Bank, Vertex AI ADC isolation, and container security profiles.

## Engineering Mandates

1. **Linux Kernel Invariant**: All target architectures must target native ELF execution on Linux x86_64; zero Windows binaries permitted.
2. **Lossless ADR Linkage**: Any architectural evolution must cite an Architectural Decision Record (ADR) under `specs/`.
3. **Evidence Bundling**: Architectural designs must specify verifiable audit logging and evidence compilation protocols.
