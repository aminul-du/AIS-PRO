# AIS-PRO Master Strategy: Portable Control Plane & Cloudflare Isolation

## 1. Tunnel Isolation Strategy (Multi-Node)
- **Ubuntu (MCORE Core)**: `ais-pro-tunnel` -> Routes to `research.mcoreai.tech`, `library.mcoreai.cloud`
- **Debian (Legacy)**: `ais001` -> Routes to legacy Shorborno production.
- **PMICS Project**: `pmics-lab-tunnel` -> Routes to `pmics.mcoreai.tech`, `labs.mcoreai.tech`

## 2. Port Registry (Zero-Trust)
- 3000: MCORE UI (FD-05)
- 8000: MCORE API (FD-03)
- 18081: PMICS Rust Gateway (FD-03)
- 18082: PMICS Python Worker (FD-04) - Loopback ONLY
- 18083: PMICS UI (FD-05) - Loopback ONLY
- *No default ports (8080, 5000, etc.) allowed.*

## 3. IPAM (Fault Domains)
All infrastructure must map to the `10.0.0.0/16` carve-out.
- FD-03 (Rust/API): `10.0.32.0/20`
- FD-04 (Python/AI): `10.0.48.0/20`
- FD-05 (Frontend): `10.0.64.0/20`

## 4. Cloudflare Edge Rule
- Cloudflare handles ALL DNS, SSL, TLS, DNSSEC, WAF, and QUIC.
- Local WSL2 environments (Debian/Ubuntu) are strictly forbidden from running `cloudflared`. All tunnels run exclusively on the GCP VM (`ais-pro-edge`) via `systemd`.
