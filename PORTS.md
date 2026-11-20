<!--
==============================================================================
MDEA PORT REGISTRY & NETWORK ENFORCEMENT STANDARD
Authority: Md. Aminul Islam ("Shamim") | Sovereign Systems Architect
Standard: MDEA Network Governance Protocol (#MCORE-NET-001)
==============================================================================
-->

# MCORE Sovereign Port Registry

This document establishes the official port assignments, network boundaries, and security policies across the Project AIS-PRO edge infrastructure and containerized microservices.

## Official Port Allocations

| Port | Service Component | Technology Stack | Network Exposure / Ingress Route |
| :--- | :--- | :--- | :--- |
| **3000** | **MCORE UI** | React / Nginx Static Server | Public Ingress (`research.mcoreai.tech`, `library.mcoreai.cloud`) |
| **8000** | **MCORE API** | Python / FastAPI / Uvicorn | Reverse Proxied via Nginx (`/api/`) |
| **18081** | **PMICS Lab Gateway** | Rust / Actix-Web / Warp | Public Ingress (`pmics.mcoreai.tech`, `labs.mcoreai.tech`, `Labs.shorbornoai.com`) |
| **18082** | **PMICS AI Worker** | Python / Async Engine | Internal Loopback Only (`127.0.0.1:18082`) |
| **18083** | **PMICS Lab Frontend / Evidence UI** | React / Vite Static Server | Internal Loopback / Proxied via Gateway |

## Security & Network Isolation Policy

1. **Explicit Port Mapping Required**:
   - **Vertex AI is forbidden from using default ports without explicit mapping.** Any integration with Vertex AI endpoints, model runtimes, or proxy bridges must explicitly declare its port allocation within this registry prior to deployment.
2. **Loopback Isolation**:
   - Services operating on ports `8000`, `18082`, and `18083` MUST bind strictly to `127.0.0.1` / `localhost` and communicate through edge reverse proxies or internal IPC.
3. **Ingress Protection**:
   - External traffic is routed exclusively through Cloudflare Tunnels (`cloudflared`) with strict zero-trust ACLs and TLS termination.
