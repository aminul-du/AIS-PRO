import os
import shutil
import subprocess
from pathlib import Path
from typing import Dict, Any
from .config import COLAB_MOUNT_PATH, get_active_drive_path

def find_colab_cli() -> str | None:
    # Check PATH first
    path = shutil.which("colab")
    if path:
        return path
    # Check default install path
    default_path = Path.home() / ".local" / "bin" / "colab"
    if default_path.exists():
        return str(default_path)
    return None

def check_mount_status() -> Dict[str, Any]:
    active_path = get_active_drive_path()
    is_colab_native = os.path.exists("/content")
    is_mounted = COLAB_MOUNT_PATH.exists() and len(os.listdir(COLAB_MOUNT_PATH)) > 0 if COLAB_MOUNT_PATH.exists() else False
    
    colab_bin = find_colab_cli()

    return {
        "colab_cli_installed": colab_bin is not None,
        "colab_cli_path": colab_bin,
        "is_colab_native": is_colab_native,
        "mount_target": str(COLAB_MOUNT_PATH),
        "is_mounted": is_mounted,
        "active_drive_path": str(active_path),
        "is_fallback": active_path != COLAB_MOUNT_PATH,
    }

def trigger_drive_mount(mount_path: str = "/content/drive") -> Dict[str, Any]:
    colab_bin = find_colab_cli()
    if not colab_bin:
        return {
            "success": False,
            "error": "colab CLI binary not found in PATH or ~/.local/bin/colab",
            "mount_status": check_mount_status()
        }
    
    try:
        # Run colab drivemount
        proc = subprocess.run(
            [colab_bin, "drivemount", mount_path],
            capture_output=True,
            text=True,
            timeout=30
        )
        return {
            "success": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "returncode": proc.returncode,
            "mount_status": check_mount_status()
        }
    except Exception as e:
        return {
            "success": False,
            "error": str(e),
            "mount_status": check_mount_status()
        }
