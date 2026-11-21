#!/usr/bin/env bash
set -euo pipefail

echo "[1/3] Upgrading PORTS.md (Preserving 3000/8000/18081-18083 + Explicit Loopback & SSH-Only Policy)..."
cat << 'EOF' > PORTS.md
<!--
==============================================================================
MDEA PORT REGISTRY & NETWORK ENFORCEMENT STANDARD
Authority: Md. Aminul Islam ("Shamim") | Sovereign Systems Architect (MCORE-FDR-AIS-001)
Standard: MDEA Network Governance Protocol (#MCORE-NET-001)
==============================================================================
-->

# MCORE Sovereign Port Registry

This document establishes the official port assignments, network boundaries, and security policies across the Project AIS-PRO edge infrastructure and containerized microservices.

## Official Port Allocations (Canonical + v4.2.0 Extensions)

| Port | Service Component | Technology Stack | Network Exposure / Ingress Route | Domain Scope |
| :--- | :--- | :--- | :--- | :--- |
| **3000** | **MCORE UI (EN/বাংলা)** | React + TS / Nginx Static Server | Cloudflare QUIC Tunnel (`research.mcoreai.tech`, `library.mcoreai.cloud`) | `isolated-mcore` |
| **8000** | **MCORE API** | Python / FastAPI / Uvicorn | Internal Loopback (`127.0.0.1:8000`) via Nginx `/api/` | `isolated-mcore` |
| **8080** | **MCore Axum WS & MCP Bus** | Rust / Axum + Native MCP Server | Internal Loopback (`127.0.0.1:8080`) / Read-Only Terminal WS | `isolated-mcore` |
| **8090** | **Vertex AI & Claude Proxy Bridge** | Rust / Reqwest Zero-Trust Bridge | Internal Loopback (`127.0.0.1:8090`) *(Explicitly Mapped)* | `isolated-mcore` |
| **18081** | **PMICS Lab Gateway** | Rust / Actix-Web / Warp | Cloudflare QUIC Tunnel (`pmics.mcoreai.tech`, `labs.mcoreai.tech`, `://shorbornoai.com`) | `isolated-shorborno` |
| **18082** | **PMICS & Accelerator AI Worker** | Python / PyTorch (`TorchNeuron` / `TorchTPU` / `TensorRT`) | Internal Loopback Only (`127.0.0.1:18082`) | `isolated-shorborno` |
| **18083** | **PMICS Lab Frontend / Evidence UI** | React / Vite Static Server | Internal Loopback (`127.0.0.1:18083`) / Proxied via Gateway | `isolated-shorborno` |
| **4222** | **NATS JetStream Telemetry Bus** | NATS 2.10 JetStream | Internal Loopback Only (`127.0.0.1:4222`) | `isolated-mcore` |
| **5432** | **PostgreSQL 17 (`pgvector`)** | PostgreSQL + SHA-256 Audit Ledger | Internal Loopback Only (`127.0.0.1:5432`) | `isolated-mcore` |
| **6333** | **Qdrant Vector Telemetry** | Qdrant Engine | Internal Loopback Only (`127.0.0.1:6333`) | `isolated-mcore` |
| **6335** | **TurboVec Vector Engine** | TurboVec High-Speed Engine | Internal Loopback Only (`127.0.0.1:6335`) | `isolated-mcore` |
| **51820** | **Multi-Cloud WireGuard Mesh** | Kernel WireGuard (UDP) | Encrypted Mesh (`BD VPS <-> AWS ap-south-1 <-> GCP asia-south1`) | `isolated-mcore` |

## Security & Network Isolation Policy

1. **Explicit Port Mapping Required**:
   - **Vertex AI is forbidden from using default ports without explicit mapping.** All Vertex AI / Claude bridges must bind strictly to `127.0.0.1:8090` as registered above.
2. **Loopback Isolation**:
   - Services operating on ports `8000`, `8080`, `8090`, `18082`, `18083`, `4222`, `5432`, `6333`, and `6335` MUST bind strictly to `127.0.0.1` / `localhost` and communicate through edge reverse proxies or internal IPC.
3. **QUIC Ingress Protection**:
   - External traffic is routed exclusively through Cloudflare Tunnels (`cloudflared --protocol quic`) via Dhaka (`DAC`) Anycast edge with strict zero-trust ACLs, Free WAF rules, and HTTP/3 QUIC termination.
4. **SSH-Only Authentication & Zero-Password Policy**:
   - All Git operations, multi-node deployments, and administrative sessions MUST authenticate exclusively via ED25519/RSA SSH keys (`git@github.com:aminul-du/AIS-PRO.git`). Password-based HTTPS Git prompts and password SSH logins (`PasswordAuthentication no`) are strictly prohibited.
EOF

echo "[2/3] Writing MDEA-compliant architecture/SMART-NET-DEPLOY.md..."
cat << 'EOF' > architecture/SMART-NET-DEPLOY.md
---
id: MCORE-ARCH-002
title: SmartNetDeploy v4.2.0 - Cloudflare QUIC, MCP, Multi-Browser & Multi-Cloud Accelerator Architecture
author_id: MCORE-FDR-AIS-001
status: verified
domain_scope: isolated-mcore
quantization_profile: L0-Lossless
last_reviewed: 2026-11-21
---

# SmartNetDeploy [Version 4.2.0-MDEA-LOCK]
**Authority:** Md. Aminul Islam ("Shamim") | `MCORE-FDR-AIS-001`
**Reference Blueprint:** MDEA (`#MCORE-MEAR-001`) — Program 001 (2026–2030)
**Workspace Root:** `/srv/mcore/NativeBox`
**Compliance Baseline:** SOC 2 Type II | ISO/IEC 27001:2022 | NIST CSF 2.0 / SP 800-53 | Hack23 ISMS

## 1. Architectural Upgrades & Governance Alignment
- **Transport Protocol:** Cloudflare Free Tier Edge (`DAC` Dhaka Anycast) enforcing **HTTP/3 over QUIC** (`cloudflared --protocol quic`) into `127.0.0.1:3000` (`MCORE UI`) and `127.0.0.1:18081` (`PMICS Lab Gateway`).
- **Zero-RAG Compliance Telemetry:** Replaced RAG pipelines with deterministic **SHA-256 cryptographic hashing**, **NATS JetStream (`127.0.0.1:4222`)**, and selectable vector telemetry engines (**Qdrant `6333`**, **TurboVec `6335`**, **PostgreSQL `pgvector` `5432`**).
- **Multi-Vendor Rendering Cores (`/srv/mcore/NativeBox`):** Horizontal tenant isolation across **Google Chrome/Chromium (V8)**, **Mozilla Firefox (Gecko)**, and **Microsoft Edge (Vendor-Native Channel)**.
- **Multi-Cloud Accelerator Portability (`isolated-shorborno` on `127.0.0.1:18082`):** Unified PyTorch worker supporting **NVIDIA TensorRT**, **AWS Trainium (`TorchNeuron`)**, and **Google Cloud TPU (`TorchTPU`)**, synced via `STAGE-360-DRIVE.md` (Google Colab + Drive).
- **Monorepo Stack:** Turborepo (`Node.js + pnpm`) managing React+TS (`EN/বাংলা`), Tauri Desktop, Read-Only Browser Terminal, Rust Axum (`127.0.0.1:8080`), and Koog Multi-Agent MCP Mesh.
EOF

echo "[3/3] Writing hardened systemd-managed/mcore-nativebox.service..."
cat << 'EOF' > systemd-managed/mcore-nativebox.service
[Unit]
Description=MCore NativeBox Axum WS & MCP Server (127.0.0.1:8080 - MDEA #MCORE-NET-001)
After=network-online.target cloudflared.service
Wants=network-online.target

[Service]
Type=simple
User=mcore
Group=mcore
WorkingDirectory=/srv/mcore/NativeBox
EnvironmentFile=-/etc/mcore/secrets.env
Environment="MCORE_BIND_ADDR=127.0.0.1:8080"
Environment="VERTEX_PROXY_ADDR=127.0.0.1:8090"
ExecStart=/srv/mcore/NativeBox/bin/mcore-control-plane
Restart=always
RestartSec=3

# MDEA Grade A+ Hardening Sandbox (Zero-Secret / Strict Loopback)
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
ReadWritePaths=/srv/mcore/NativeBox/data

[Install]
WantedBy=multi-user.target
EOF

echo "[SUCCESS] /srv/mcore/AIS-PRO upgraded cleanly."
