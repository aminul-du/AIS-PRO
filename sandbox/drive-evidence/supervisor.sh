#!/usr/bin/env bash
# ==============================================================================
# AIS-PRO 24/7 Multi-Service Cold-Boot Supervisor
# Authority: Md. Aminul Islam ("Shamim") | MCORE-FDR-AIS-001
# Manages: Cloudflare Tunnel, FastAPI MTE Backend (:8000), Vite Frontend (:3000)
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
AIS_PRO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
LOG_DIR="$AIS_PRO_ROOT/sandbox/evidence/logs"
PID_FILE="$AIS_PRO_ROOT/sandbox/evidence/supervisor.pids"
TUNNEL_CONFIG="/tmp/cf_tunnel_config.yml"

mkdir -p "$LOG_DIR"

BACKEND_LOG="$LOG_DIR/backend_supervisor.log"
FRONTEND_LOG="$LOG_DIR/frontend_supervisor.log"
TUNNEL_LOG="$LOG_DIR/tunnel_supervisor.log"

echo "================================================================================"
echo "          AIS-PRO PRODUCTION MULTI-SERVICE SUPERVISOR                          "
echo " Authority: MCORE-FDR-AIS-001 | Meticulous Core Ltd.                           "
echo "================================================================================"

cleanup() {
    echo -e "\n[!] Shutting down AIS-PRO edge services gracefully..."
    if [ -f "$PID_FILE" ]; then
        while read -r pid; do
            if kill -0 "$pid" 2>/dev/null; then
                echo "    Terminating PID $pid..."
                kill -TERM "$pid" 2>/dev/null || true
            fi
        done < "$PID_FILE"
        rm -f "$PID_FILE"
    fi
    echo "[-] Shutdown complete."
    exit 0
}

trap cleanup SIGINT SIGTERM EXIT

# 1. Start FastAPI MTE Backend
echo "[1/3] Starting FastAPI MTE Backend on 127.0.0.1:8008..."
cd "$SCRIPT_DIR"
export PYTHONPATH="$SCRIPT_DIR"
export PYTHONUNBUFFERED=1
nohup "$SCRIPT_DIR/backend/.venv/bin/uvicorn" backend.app.main:app --host 127.0.0.1 --port 8008 >> "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!
echo "$BACKEND_PID" >> "$PID_FILE"
echo "      Backend started (PID: $BACKEND_PID, Log: $BACKEND_LOG)"

# 2. Start Frontend Server
echo "[2/3] Starting React 19 Frontend on 127.0.0.1:3000..."
cd "$SCRIPT_DIR/frontend"
nohup npm run preview -- --port 3000 --host 127.0.0.1 >> "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!
echo "$FRONTEND_PID" >> "$PID_FILE"
echo "      Frontend started (PID: $FRONTEND_PID, Log: $FRONTEND_LOG)"

# 3. Start Cloudflare Tunnel
echo "[3/3] Starting Cloudflare Tunnel Daemon..."
if [ -f "$TUNNEL_CONFIG" ]; then
    nohup cloudflared tunnel --config "$TUNNEL_CONFIG" run >> "$TUNNEL_LOG" 2>&1 &
    TUNNEL_PID=$!
    echo "$TUNNEL_PID" >> "$PID_FILE"
    echo "      Tunnel started (PID: $TUNNEL_PID, Log: $TUNNEL_LOG)"
else
    echo "      [WARN] Tunnel config not found at $TUNNEL_CONFIG. Tunnel skipped."
fi

echo "================================================================================"
echo ">>> ALL SERVICES ACTIVE AND SUPERVISED. Press Ctrl+C to terminate."
echo "================================================================================"

# Watchdog loop
while true; do
    sleep 10
    if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
        echo "[RECOVERY] Backend died. Restarting..." >> "$BACKEND_LOG"
        nohup "$SCRIPT_DIR/backend/.venv/bin/uvicorn" main:app --host 127.0.0.1 --port 8000 >> "$BACKEND_LOG" 2>&1 &
        BACKEND_PID=$!
    fi
done
