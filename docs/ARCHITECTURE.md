# Meticulous Core Ltd. — AIS-PRO Architecture & Security Posture

- **Node:** `MCORE-FDR-AIS-001` | **Repository:** `github.com/aminul-du/AIS-PRO`
- **Multi-Cloud & Accelerator Portability:** Provider-neutral microservices across `MCORE-FDR-AIS-001`, AWS EC2 (`TorchNeuron` for AWS Trainium), and Google Cloud (`TorchTPU` for Cloud TPU).
- **Zero-Cost Strategy:** Local-first loopback execution (`127.0.0.1:18088` Arena, `:18089` MCP, `:18090` Pulse) exposed via Cloudflare Tunnel (`391d621e-508e-428d-8a14-452db9e825e8`) and Zero Trust Access.
- **Evidence-First Security (Hack23 Posture):** Declarative port governance, automated CI secret scanning, and verifiable telemetry snapshots.
