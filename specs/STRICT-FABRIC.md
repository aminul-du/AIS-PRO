---
id: MCORE-SPEC-002
title: Strict Fabric Architecture & Domain Isolation Specification
author_id: MCORE-FDR-AIS-001
status: verified
domain_scope: isolated-mcore
quantization_profile: L0-Lossless
last_reviewed: 2026-11-19
---

# Strict Fabric Architecture & Domain Isolation Specification

**Specification ID:** MCORE-SPEC-002  
**Authority:** Md. Aminul Islam ("Shamim") | `MCORE-FDR-AIS-001`  
**Organization:** Meticulous Core Ltd. (MCore)  
**Governance Scope:** Kernel Namespaces, Network Routing & Domain Segregation  
**Classification:** `isolated-mcore` • Lossless Core Standard  

---

## 1. Executive Summary & Architectural Intent

This specification establishes the **Strict Fabric Architecture** governing all execution environments, network boundaries, and memory domains under Meticulous Core Ltd. 

The primary objectives of this fabric are:
1. Complete cryptographic and network isolation between sovereign IP, open research, and cultural models.
2. Prevention of memory poisoning, lateral privilege escalation, and unintended cross-domain data leakage.
3. Enforcement of the Pure Linux Kernel mandate, eliminating non-native execution dependencies and enforcing zero-secret isolation across all nodes.

---

## 2. Three-Domain Scope Taxonomy

All data assets, neural models, source repositories, and memory vectors within `AIS-PRO` operate under one of three mutually exclusive domain scopes:

```
+─────────────────────────────────────────────────────────────────────────────+
|                         STRICT DOMAIN SCOPE MATRIX                          |
+─────────────────────────────────────────────────────────────────────────────+
                                       │
     ┌─────────────────────────────────┼─────────────────────────────────┐
     ▼                                 ▼                                 ▼
┌───────────────────────────┐ ┌───────────────────────────┐ ┌───────────────────────────┐
│     general-ai-agi        │ │      isolated-mcore       │ │    isolated-shorborno     │
├───────────────────────────┤ ├───────────────────────────┤ ├───────────────────────────┤
│ • Universal AI theory     │ │ • Sovereign enterprise IP │ │ • Shorborno AI initiatives│
│ • Public research papers  │ │ • Executive MDEA baseline │ │ • Bengali & regional NLP  │
│ • Open benchmark models   │ │ • Commercial engines      │ │ • Localized linguistic KG │
│ • Non-proprietary evals   │ │ • Production ADC tokens   │ │ • Cultural neural corpus  │
│ • Unrestricted egress     │ │ • Air-gapped / Tunnel     │ │ • Sovereign dialect data  │
└───────────────────────────┘ └───────────────────────────┘ └───────────────────────────┘
```

### 2.1 Domain Governance Rules

1. **`general-ai-agi` (Public / Open Research Domain):**
   - Egress/ingress: Unrestricted public access; subject to standard hygiene.
   - Purpose: Tracking frontier AI breakthroughs, mathematical formulations, and public evaluation suites.
   - Constraint: **Zero proprietary MCore code or credentials may ever enter this domain.**

2. **`isolated-mcore` (Sovereign Core Domain):**
   - Egress/ingress: Strict Cloudflare Tunnel egress, refusal-first memory gates, ADC-isolated IAM.
   - Purpose: Enterprise intellectual property, executive decision matrices, commercial platform infrastructure.
   - Constraint: **Absolute isolation.** Direct unauthenticated internet listeners are forbidden. All ingress must pass the Refusal-First Memory Trust Engine (MTE).

3. **`isolated-shorborno` (Specialized Language & Cultural Domain):**
   - Egress/ingress: Dedicated linguistic sandboxes, verifiable provenance indexing.
   - Purpose: Preserving and advancing high-integrity Bengali language modeling, cultural knowledge preservation, and regional reasoning engines.
   - Constraint: Independent memory stores; cannot be contaminated by unadjudicated general web-scraped noise.

---

## 3. Network & Kernel Namespace Fabric

The Strict Fabric relies on dual-distro kernel isolation and deterministic network namespace boundaries implemented on Linux x86_64:

```
+─────────────────────────────────────────────────────────────────────────────+
|                         WSL-DEVNET STRICT FABRIC TOPOLOGY                   |
+─────────────────────────────────────────────────────────────────────────────+
 🪟 Host Environment (Windows / Management Hypervisor)
  │  - Primary Host IP: 172.23.176.1
  │  - Static Route: 172.23.180.161/32 -> 172.23.180.160
  │
  └─── 🐧 Shared Linux Kernel (x86_64 / Kernel 6.6+)
        │
        ├── 📦 Root Network Namespace (Debian 13)
        │    - Interface: eth0 (IP: 172.23.180.160/20)
        │    - Role: Primary Development & Cloudflare Egress Coordinator
        │    - Transit Gateway: veth0 (10.200.1.1/24)
        │    - NAT Rule: iptables -t nat -A POSTROUTING -s 10.200.1.0/24 -o eth0 -j MASQUERADE
        │
        └── 🔒 Isolated Network Namespace: mcore-ns (Ubuntu Pro)
             - Interface: veth1 (Transit IP: 10.200.1.2/24)
             - Loopback Target IP: 172.23.180.161/32
             - Role: Isolated Execution & Unattended Worker Sandboxing
             - Port Spaces: Completely independent from root namespace
```

### 3.1 Kernel & Binary Invariants
* **Pure ELF Standard:** Only native 64-bit ELF (Executable and Linkable Format) binaries execute within the Linux namespaces. Running `.exe` or Windows emulation binaries in the production pipeline is strictly prohibited.
* **POSIX Process Isolation:** Applications execute within isolated process groups (`setpgid`) with signal trapping (`SIGINT`, `SIGTERM`, `EXIT`) to guarantee zero zombie child processes or leaked socket bindings upon teardown.
* **Dynamic Non-Privileged Ports:** Listeners dynamically probe non-privileged ports (`8008`, `8088`, `8000`) with graceful fallbacks.

---

## 4. Cross-Domain Ingress & Refusal-First Gauntlet

No artifact or memory vector may transit between domains without passing the **Refusal-First Ingress Gauntlet**:

```
                         [ Ingress Candidate Payload ]
                                       │
                                       ▼
                       +───────────────────────────────+
                       | 1. Provenance Verification    |
                       |    - Check author_id & sha256 |
                       +───────────────┬───────────────+
                                       │ Verified
                                       ▼
                       +───────────────────────────────+
                       | 2. Injection & Taint Scoring  |
                       |    - Scan for prompt exploits |
                       |    - Anomaly threshold < 0.05 |
                       +───────────────┬───────────────+
                                       │ Safe
                                       ▼
                       +───────────────────────────────+
                       | 3. Domain Boundary Fence      |
                       |    - Check target domain scope|
                       |    - ADR clearance verified   |
                       +───────────────┬───────────────+
                                       │ Cleared
                                       ▼
                         [ Admitted: Status CONFIRMED ]
```

1. **Refusal by Default:** Any payload missing verifiable provenance, possessing mismatched cryptographic hashes, or lacking an ADR authorization is dropped immediately.
2. **Taint Tracking:** Data ingested from `general-ai-agi` into `isolated-mcore` is marked as `TAINTED-OPEN` until sanitized through full unit-test verification and human ADR review.
3. **No Cross-Contamination of Weights:** Model weights fine-tuned on `isolated-shorborno` data cannot be merged into `general-ai-agi` without explicit Founder sign-off (`MCORE-FDR-AIS-001`).

---

## 5. Zero-Secret Identity & Access Control

1. **No Static API Keys:** Production environments strictly prohibit API tokens hardcoded in configuration files or persistent files.
2. **Host-Local ADC Standard:** Google Cloud Vertex AI access utilizes Application Default Credentials (ADC) stored at `~/.config/gcloud/application_default_credentials.json` with permissions locked to `0600` (`-rw-------`).
3. **Independent Local Grants:** No copying of credential tokens across hosts or namespaces. Each node must authenticate via independent OAuth workflows or managed service accounts (`mcore-ubuntu-worker` with `roles/aiplatform.user`).

---

## 6. Audit & Fabric Verification

Periodic verification commands must confirm fabric health:
- `ip netns exec mcore-ns ip addr show veth1`: Validates namespace IP isolation (`172.23.180.161/32`).
- `stat -c "%a %n" ~/.config/gcloud/application_default_credentials.json`: Confirms `0600` permissions.
- `git status`: Verifies no uncommitted `.env`, secret, or credential artifacts exist in the repository tree.
