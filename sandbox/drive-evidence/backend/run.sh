#!/usr/bin/env bash
set -e

DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"
cd "$DIR/.."

export PYTHONUNBUFFERED=1
export PYTHONPATH="$DIR/..:${PYTHONPATH:-}"
exec "$DIR/.venv/bin/uvicorn" apps.api.main:app --host 0.0.0.0 --port 8000 --reload
