---
id: MCORE-DIR-LABS
title: Labs Directory Overview & Experimental Sandbox Protocols
author_id: MCORE-FDR-AIS-001
status: active
domain_scope: general-ai-agi
quantization_profile: L2-Bounded-Lossy
last_reviewed: 2026-11-19
---

# Labs Directory (`labs/`)

**Authority:** Md. Aminul Islam ("Shamim") | `MCORE-FDR-AIS-001`  
**Organization:** Meticulous Core Ltd. (MCore)  
**Security Tier:** Experimental Sandbox • Refusal-First Isolation  

---

## Purpose & Scope

The `labs/` directory provides an isolated testing ground for exploratory prototypes, model evaluation spikes, transient agent experiments, and benchmark scripts.

Work conducted in `labs/` represents **State 1 (Draft / Sandbox)** of the Specification Adoption Lifecycle (`specs/ADOPTION-AND-QUANTIZATION.md`).

## Sandbox Protocol & Guardrails

1. **Strict Sandboxing**:
   - Code executed here must run under parameter fencing (Python 3.14 native process groups, max 2.0 GB RSS, 30s timeout).
   - Egress is restricted to non-privileged local ports or verified testing networks.
2. **Ephemeral Status**:
   - Code and outputs in `labs/` are considered transient until promoted via an Architectural Decision Record (ADR).
   - Unverified code in `labs/` must never be deployed directly to production.
3. **Zero Secret Rule**:
   - Testing scripts must use mocked credentials or local test doubles. Real production credentials, API keys, or ADC tokens are strictly prohibited.
4. **Promotion Pathway**:
   - To promote a lab prototype to production, follow the 5-state adoption pipeline:
     `Draft / Sandbox` -> `Verified Spec (ADR)` -> `Staging (Stage 360 Drive)` -> `Controlled Production`.
