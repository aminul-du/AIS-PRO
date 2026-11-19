#!/usr/bin/env bash
# ==============================================================================
# AIS-PRO Systemd Service Installer
# Authority: Md. Aminul Islam ("Shamim") | MCORE-FDR-AIS-001
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SYSTEMD_USER_DIR="$HOME/.config/systemd/user"

echo "================================================================================"
echo "          AIS-PRO SYSTEMD SERVICE INSTALLER (#MCORE-MEAR-001)                  "
echo "================================================================================"

mkdir -p "$SYSTEMD_USER_DIR"

echo "[1/3] Copying systemd unit files to $SYSTEMD_USER_DIR..."
cp "$SCRIPT_DIR"/ais-pro-*.service "$SYSTEMD_USER_DIR/"

echo "[2/3] Reloading systemd user daemon..."
if command -v systemctl >/dev/null 2>&1 && systemctl --user is-active dbus >/dev/null 2>&1; then
    systemctl --user daemon-reload
    systemctl --user enable ais-pro-tunnel.service ais-pro-backend.service ais-pro-frontend.service
    echo "      Enabled user services: ais-pro-tunnel, ais-pro-backend, ais-pro-frontend"
else
    echo "      [Note: systemd user session not active in current subshell. Service files staged successfully.]"
fi

echo "[3/3] Systemd installation complete."
echo "================================================================================"
