#!/usr/bin/env bash
# ==============================================================================
# Edge Node Provisioning & Cloudflare Tunnel Deployment
# Authority: Md. Aminul Islam ("Shamim") | MCORE-FDR-AIS-001
# Phase 2: Application Integration & Edge Deployment
# ==============================================================================
set -euo pipefail

EDGE_INSTANCE_NAME="ais-pro-edge"
GCP_ZONE="asia-east1-b"
MACHINE_TYPE="e2-micro"
IMAGE_FAMILY="ubuntu-2404-lts-amd64"
IMAGE_PROJECT="ubuntu-os-cloud"
TUNNEL_NAME="ais-pro-tunnel"
MOUNT_POINT="/mnt/ais-evidence"

echo "================================================================================"
echo "          EDGE PROVISIONING: $EDGE_INSTANCE_NAME (Zone: $GCP_ZONE)          "
echo "================================================================================"

# 1. Authenticate (Assumes execution context is already authorized via ADC/ADC-local)
echo "[1/4] Checking gcloud & cloudflared authentication..."
gcloud auth list
cloudflared tunnel list || echo "Note: cloudflared may require login."

# 2. Provision GCP VM
echo "[2/4] Provisioning GCP Edge Node in $GCP_ZONE..."
# (Uncomment the line below in a live execution context)
gcloud compute instances create "$EDGE_INSTANCE_NAME" \
    --zone="$GCP_ZONE" \
    --machine-type="$MACHINE_TYPE" \
    --image-family="$IMAGE_FAMILY" \
    --image-project="$IMAGE_PROJECT" \
    --tags=http-server,https-server \
    --metadata=startup-script="#!/bin/bash
      apt-get update
      apt-get install -y rclone curl
      curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
      dpkg -i cloudflared.deb
      mkdir -p $MOUNT_POINT
      # rclone config will be injected securely
"

echo "      Instance $EDGE_INSTANCE_NAME configuration scheduled."

# 3. Cloudflare Tunnel Configuration
echo "[3/4] Configuring Cloudflare Tunnel: $TUNNEL_NAME..."
# (Uncomment in live execution)
cloudflared tunnel create "$TUNNEL_NAME" || true
cloudflared tunnel route dns "$TUNNEL_NAME" research.mcoreai.com || true
cloudflared tunnel route dns "$TUNNEL_NAME" library.mcoreai.cloud || true

# Generate config.yml
cat <<EOF > /tmp/cf_tunnel_config.yml
tunnel: $TUNNEL_NAME
credentials-file: /root/.cloudflared/credentials.json

ingress:
  - hostname: research.mcoreai.com
    service: http://localhost:3000
  - hostname: library.mcoreai.cloud
    service: http://localhost:8000
  - service: http_status:404
EOF

echo "      Tunnel configuration generated at /tmp/cf_tunnel_config.yml"

# 4. Start Tunnel
echo "[4/4] Starting Edge Tunnel Routing..."
cloudflared tunnel --config /tmp/cf_tunnel_config.yml run &
echo "      Edge routing ready: research.mcoreai.com -> :3000, library.mcoreai.cloud -> :8000"

echo "================================================================================"
echo ">>> Edge Provisioning & Tunnel Configuration Mapped. Ready for Live Deployment."
echo "================================================================================"
