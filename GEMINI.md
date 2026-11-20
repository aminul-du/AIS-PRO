# MCORE Multi-Cloud Constitution (v1.0)
**Authority:** Md. Aminul Islam ("Shamim") | Sovereign Systems Architect
**Governance Scope:** Multi-Cloud, Pure Linux Kernel, Zero-Trust Fabric

---

### Principle 1: Pure IPAM & Fault Domains (10.0.0.0/16)
All compute nodes, overlays, and virtual network interfaces must map exclusively to the strict 16x /20 CIDR carve-out:
- **FD-00 (Fabric):** `10.0.240.0/20`
- **FD-01 (Kernel/Host):** `10.0.0.0/20`
- **FD-02 (Network/Tunnels):** `10.0.16.0/20`
- **FD-03 (Rust/API):** `10.0.32.0/20`
- **FD-04 (Python/AI):** `10.0.48.0/20`
- **FD-05 (Frontend):** `10.0.64.0/20`
- **FD-06 (CI/CD):** `10.0.80.0/20`
- **FD-07 (Observability):** `10.0.96.0/20`
- **FD-08 (Data/Database):** `10.0.112.0/20`
- **FD-09 (Backup/DR):** `10.0.128.0/20`
- **FD-10 (Agent/MCP):** `10.0.144.0/20`
- **FD-11 (Secrets/Identity):** `10.0.160.0/20`
- **FD-12 (DNS/Mesh):** `10.0.176.0/20`
- **FD-13 (CDN/Edge - Cloudflare):** `10.0.192.0/20`
- **FD-14 (Web Vitals):** `10.0.208.0/20`
- **FD-15 (Governance):** `10.0.224.0/20`

---

### Principle 2: Zero-Trust Port Registry & Loopback Binding
Every service must bind to its immutable port allocation:
- **Port 3000:** MCORE UI (FD-05)
- **Port 8000:** MCORE API (FD-03)
- **Port 18081:** PMICS Rust Gateway (FD-03)
- **Port 18082:** PMICS Python Worker (FD-04) — **LOOPBACK ONLY (`127.0.0.1`)**
- **Port 18083:** PMICS UI (FD-05) — **LOOPBACK ONLY (`127.0.0.1`)**
- **Prohibition:** Default and conflicting ports (`8080`, `5000`, `8888`, `9000`) are strictly banned. New labs and R&D services must allocate dedicated ports in the `18000+` range.

---

### Principle 3: Cloudflare-Native Project Tunnel Isolation
Traffic routing must maintain absolute 1:1 project-to-tunnel segregation:
- **MCORE Core:** `ais-pro-tunnel` -> Routes `research.mcoreai.tech`, `library.mcoreai.cloud`
- **Legacy / Debian:** `ais001` -> Routes legacy Shorborno production traffic
- **PMICS Project:** `pmics-lab-tunnel` -> Routes `pmics.mcoreai.tech`, `labs.mcoreai.tech`
- Multi-tenant cross-wiring between project tunnels is strictly prohibited.

---

### Principle 4: Edge-Exclusive Ingress (Zero-WSL Tunnels)
- Cloudflare Edge terminates and manages all public DNS, SSL/TLS, DNSSEC, WAF, and QUIC/HTTP3.
- Local WSL2, Debian, and Ubuntu developer workstations are strictly forbidden from running `cloudflared` daemons.
- All edge ingress tunnels run exclusively on the hardened GCP Edge VM (`ais-pro-edge`) managed by systemd.

---

### Principle 5: Deterministic Process Lifecycle & Signal Traps
- All production services must be orchestrated via `systemd` with `Restart=always` and explicit resource ceilings.
- Every bash deployment, launcher, or supervisor script must declare:
  ```bash
  set -euo pipefail
  trap 'kill 0' EXIT INT TERM
  ```
  Orphaned processes and unmanaged subprocess trees are zero-tolerance violations.

---

### Principle 6: Cryptographic Provenance & Protected Governance
- Every commit, release artifact, and configuration delta must be cryptographically signed (`git commit -S`) using authorized ED25519 keys.
- Base branches (`main`) are protected by automated CI/CD verification gauntlets (Zero-Secret scans, frontmatter validation, and clean builds).
- No unverified AI mutations or untracked state drift are permitted across environments.
