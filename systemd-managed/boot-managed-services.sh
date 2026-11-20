#!/bin/bash
set -euo pipefail
trap 'kill $(jobs -p) 2>/dev/null' EXIT INT TERM

echo "Starting Managed Services..."

# 1. Start the Secure Tunnel
echo "Starting Cloudflare Tunnel (1/2)..."
/home/mcoreai/.local/bin/cloudflared tunnel --config /home/mcoreai/AIS-PRO/systemd-managed/cloudflared/config.yml run fd5bd793-6d5f-45a3-9f7d-200009b12f25 &

# Wait briefly for tunnel init
sleep 2

# 2. Start PMICS Lab
echo "Starting PMICS Lab (2/2)..."
export GATEWAY_PORT=18081
export WORKER_PORT=18082
export DASHBOARD_PORT=18083
/bin/bash /home/mcoreai/AIS-PRO/shorborno-pmics-lab/start_pmics_lab.sh &

echo "All services booted via managed hypervisor script."
wait
