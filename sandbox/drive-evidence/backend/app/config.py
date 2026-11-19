import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKEND_DIR = Path(__file__).resolve().parent.parent

# Default Colab Drive mount path
COLAB_MOUNT_PATH = Path("/content/drive")
# Fallback local drive directory for development/demo
LOCAL_DRIVE_PATH = BASE_DIR / "sample_drive"

def get_active_drive_path() -> Path:
    """Returns the mounted Google Drive path if available, else local fallback."""
    if COLAB_MOUNT_PATH.exists() and os.path.isdir(COLAB_MOUNT_PATH):
        return COLAB_MOUNT_PATH
    return LOCAL_DRIVE_PATH

SANDBOX_TEMP_DIR = BASE_DIR / "sandbox_runs"
SANDBOX_TEMP_DIR.mkdir(parents=True, exist_ok=True)
LOCAL_DRIVE_PATH.mkdir(parents=True, exist_ok=True)

PYTHON_EXECUTABLE = str(BACKEND_DIR / ".venv" / "bin" / "python")
if not os.path.exists(PYTHON_EXECUTABLE):
    PYTHON_EXECUTABLE = "python3"
