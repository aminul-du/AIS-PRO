#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR"

# Ensure environment variables
export PYTHONPATH="$DIR:${PYTHONPATH:-}"
export PYTHONUNBUFFERED=1
export MTE_ATTACKS_ENABLED=false

# Intelligent Port Availability Detection
check_port() {
    local port=$1
    if ss -tulpn 2>/dev/null | grep -q ":$port "; then
        return 1
    fi
    return 0
}

API_PORT="${PORT:-8000}"
if ! check_port "$API_PORT"; then
    echo "⚠️  Port $API_PORT is already in use by another service. Selecting port 8008..."
    API_PORT=8008
fi

PRES_PORT="${PRES_PORT:-8080}"
if ! check_port "$PRES_PORT"; then
    echo "⚠️  Port $PRES_PORT is already in use by another service. Selecting port 8088..."
    PRES_PORT=8088
fi

echo "============================================================"
echo "  🚀 Starting mte-lab / Gemini Enterprise Agent Platform    "
echo "  API & App Port: $API_PORT                                 "
echo "  Dedicated Presentation Port: $PRES_PORT                   "
echo "============================================================"

MODE="${1:-all}"

if [ "$MODE" == "--dev" ] || [ "$MODE" == "dev" ]; then
    echo "Starting in Live Development Mode (FastAPI + Vite HMR + Presentation)..."

    # 1. FastAPI Unified Backend
    "$DIR/backend/.venv/bin/uvicorn" backend.app.main:app --host 0.0.0.0 --port "$API_PORT" --reload &
    BACKEND_PID=$!

    # 2. Presentation Server
    python3 -m http.server "$PRES_PORT" --directory "$DIR/presentation" &
    PRES_PID=$!

    # 3. React Frontend (5173)
    cd "$DIR/frontend"
    npm run dev -- --host 0.0.0.0 --port 5173 &
    FRONT_PID=$!

    trap 'kill $BACKEND_PID $PRES_PID $FRONT_PID 2>/dev/null' EXIT INT TERM
    echo "✅ Unified Backend running on http://localhost:$API_PORT"
    echo "✅ Dedicated Presentation running on http://localhost:$PRES_PORT"
    echo "✅ Vite UI running on http://localhost:5173"
    wait
else
    echo "Starting Production Services..."

    # 1. Start Static Presentation in background
    python3 -m http.server "$PRES_PORT" --directory "$DIR/presentation" &
    PRES_PID=$!

    # 2. Trap for clean exit
    trap 'kill $PRES_PID 2>/dev/null' EXIT INT TERM

    echo "✅ Presentation running on: http://localhost:$API_PORT/presentation/"
    echo "✅ Dedicated Presentation:   http://localhost:$PRES_PORT"
    echo "✅ Unified Backend running on: http://localhost:$API_PORT"

    # 3. Start Unified FastAPI application
    exec "$DIR/backend/.venv/bin/uvicorn" backend.app.main:app --host 0.0.0.0 --port "$API_PORT"
fi
