import os
import sys
import time
import uuid
import subprocess
from pathlib import Path
from typing import Dict, Any
from .config import PYTHON_EXECUTABLE, SANDBOX_TEMP_DIR, get_active_drive_path

def execute_sandbox_code(code: str, timeout_seconds: int = 20) -> Dict[str, Any]:
    run_id = str(uuid.uuid4())[:8]
    script_path = SANDBOX_TEMP_DIR / f"run_{run_id}.py"
    drive_path = str(get_active_drive_path().resolve())

    # Prepend environment bootstrap so user script easily discovers drive files
    bootstrap_code = f"""# --- sboxdrive-gdocs auto-bootstrap ---
import sys, os
DRIVE_PATH = "{drive_path}"
os.environ["DRIVE_PATH"] = DRIVE_PATH
# Also alias /content/drive if not in colab
if not os.path.exists("/content/drive") and os.path.exists(DRIVE_PATH):
    pass
# --- User Code ---
{code}
"""
    script_path.write_text(bootstrap_code, encoding="utf-8")

    start_time = time.time()
    try:
        proc = subprocess.run(
            [PYTHON_EXECUTABLE, str(script_path)],
            capture_output=True,
            text=True,
            cwd=str(SANDBOX_TEMP_DIR),
            timeout=timeout_seconds,
            env={
                **os.environ,
                "DRIVE_PATH": drive_path,
                "PYTHONUNBUFFERED": "1"
            }
        )
        duration = round(time.time() - start_time, 3)
        return {
            "success": proc.returncode == 0,
            "stdout": proc.stdout,
            "stderr": proc.stderr,
            "exit_code": proc.returncode,
            "duration_seconds": duration,
            "script_id": run_id
        }
    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "stdout": "",
            "stderr": f"Execution timed out after {timeout_seconds} seconds.",
            "exit_code": -1,
            "duration_seconds": timeout_seconds,
            "script_id": run_id
        }
    except Exception as e:
        return {
            "success": False,
            "stdout": "",
            "stderr": str(e),
            "exit_code": 1,
            "duration_seconds": round(time.time() - start_time, 3),
            "script_id": run_id
        }
    finally:
        # Cleanup temporary runner script
        if script_path.exists():
            try:
                script_path.unlink()
            except OSError:
                pass
