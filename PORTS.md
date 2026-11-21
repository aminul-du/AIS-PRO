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
| **18081** | **PMICS Lab Gateway** | Rust / Actix-Web / Warp | Cloudflare QUIC Tunnel (`pmics.mcoreai.tech`, `labs.mcoreai.tech`, `labs.shorbornoai.com`) | `isolated-shorborno` |
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
