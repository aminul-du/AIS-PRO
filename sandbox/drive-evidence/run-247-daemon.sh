#!/usr/bin/env bash
# ==============================================================================
# MCORE-ShorbornoAi-BD-Unified-Research-Library
# 24/7 Production Daemon Supervisor for mte-lab
# ==============================================================================
set -euo pipefail

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

LOG_DIR="$DIR/sandbox_runs"
mkdir -p "$LOG_DIR"
APP_LOG="$LOG_DIR/mte_app_247.log"
TUNNEL_LOG="$LOG_DIR/mte_tunnel_247.log"

export PYTHONPATH="$DIR:${PYTHONPATH:-}"
export PYTHONUNBUFFERED=1
export MTE_ATTACKS_ENABLED=false

PORT=8008

echo "[$(date -u +%FT%TZ)] Initializing 24/7 Daemon Supervisor for MCORE-ShorbornoAi-BD-Unified-Research-Library..." | tee -a "$APP_LOG"

# 1. Terminate old instances on port 8008
pkill -f "uvicorn backend.app.main:app.*8008" 2>/dev/null || true
pkill -f "cloudflared tunnel.*8008" 2>/dev/null || true
sleep 1

# 2. Launch Uvicorn in detached nohup supervisor loop
nohup bash -c "
    while true; do
        echo \"[\$(date -u +%FT%TZ)] [Uvicorn] Starting backend.app.main:app on :$PORT...\" >> '$APP_LOG'
        '$DIR/backend/.venv/bin/uvicorn' backend.app.main:app --host 0.0.0.0 --port $PORT >> '$APP_LOG' 2>&1 || true
        echo \"[\$(date -u +%FT%TZ)] [Uvicorn] Exited. Restarting in 3s...\" >> '$APP_LOG'
        sleep 3
    done
" >/dev/null 2>&1 &
APP_PID=$!

# 3. Launch Cloudflare Tunnel in detached nohup supervisor loop
nohup bash -c "
    while true; do
        echo \"[\$(date -u +%FT%TZ)] [Cloudflare] Launching tunnel for :$PORT...\" >> '$TUNNEL_LOG'
        cloudflared tunnel --url 'http://127.0.0.1:$PORT' --no-autoupdate >> '$TUNNEL_LOG' 2>&1 || true
        echo \"[\$(date -u +%FT%TZ)] [Cloudflare] Reconnecting in 5s...\" >> '$TUNNEL_LOG'
        sleep 5
    done
" >/dev/null 2>&1 &
TUNNEL_PID=$!

echo "✅ 24/7 Daemon Supervisor launched successfully."
echo "   - Application PID: $APP_PID"
echo "   - Tunnel PID:      $TUNNEL_PID"
echo "   - Application Log: $APP_LOG"
echo "   - Tunnel Log:      $TUNNEL_LOG"
