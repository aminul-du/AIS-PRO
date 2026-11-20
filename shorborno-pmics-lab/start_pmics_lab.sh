#!/bin/bash
set -euo pipefail
trap 'kill 0' EXIT INT TERM

# Configurations
GATEWAY_PORT=${GATEWAY_PORT:-18081}
WORKER_PORT=${WORKER_PORT:-18082}
DASHBOARD_PORT=${DASHBOARD_PORT:-18083}
LAB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Starting PMICS Lab..."

# Python Worker Setup
echo "Setting up Python Worker..."
cd "$LAB_DIR/ai-worker-python"
uv venv --clear .venv > /dev/null
source .venv/bin/activate
uv pip install -r requirements.txt > /dev/null
WORKER_PORT=$WORKER_PORT python main.py &
PYTHON_PID=$!

# Rust Gateway Setup
echo "Building Rust Gateway..."
source "$HOME/.cargo/env"
cd "$LAB_DIR/gateway-rust"
cargo build --release > /dev/null
GATEWAY_PORT=$GATEWAY_PORT WORKER_URL="http://127.0.0.1:$WORKER_PORT" ./target/release/gateway-rust &
RUST_PID=$!

# Wait for services
sleep 5

echo "Starting Cloudflare Tunnel..."
cloudflared tunnel --config "$LAB_DIR/tunnel-config.yml" run pmics-lab-tunnel > "$LAB_DIR/tunnel.log" 2>&1 &
TUNNEL_PID=$!

echo "Running Smoke Tests (RQ1-RQ4)..."

echo "Test A (RQ1): Benign Bengali baseline"
curl -s -X POST http://127.0.0.1:$GATEWAY_PORT/process -H "Content-Type: application/json" -d '{"language_mode": "bengali", "channel": "doc_upload", "provenance": "verified"}' | grep -q "passed" && echo "RQ1 Passed" || echo "RQ1 Failed"

echo "Test B (RQ2): Banglish equivalence"
curl -s -X POST http://127.0.0.1:$GATEWAY_PORT/process -H "Content-Type: application/json" -d '{"language_mode": "banglish", "channel": "user_chat", "provenance": "verified"}' | grep -q "passed" && echo "RQ2 Passed" || echo "RQ2 Failed"

echo "Test C (RQ3): Adversarial Bengali/mixed prompt injection"
curl -s -X POST http://127.0.0.1:$GATEWAY_PORT/process -H "Content-Type: application/json" -d '{"language_mode": "mixed", "channel": "mcp_tool", "provenance": "spoofed"}' | grep -q "failed" && echo "RQ3 Passed" || echo "RQ3 Failed"

echo "Test D (RQ4): Controlled recovery"
curl -s -X POST http://127.0.0.1:$GATEWAY_PORT/api/recover | grep -q "recovered" && echo "RQ4 Passed" || echo "RQ4 Failed"

echo "Lab running."
echo "Press Ctrl+C to stop."
wait $PYTHON_PID $RUST_PID $TUNNEL_PID
