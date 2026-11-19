import os
import json
import mimetypes
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any
from .config import get_active_drive_path

def get_safe_path(subpath: str = "") -> Path:
    base = get_active_drive_path().resolve()
    # Normalize path and prevent directory traversal
    clean_sub = subpath.strip().lstrip("/")
    target = (base / clean_sub).resolve()
    if not str(target).startswith(str(base)):
        raise ValueError("Invalid path traversal attempted")
    return target

def list_drive_files(subpath: str = "") -> Dict[str, Any]:
    target_dir = get_safe_path(subpath)
    base_dir = get_active_drive_path().resolve()
    
    if not target_dir.exists():
        return {
            "current_path": subpath,
            "exists": False,
            "items": []
        }

    items = []
    try:
        for entry in os.scandir(target_dir):
            stat = entry.stat()
            rel_path = str(Path(entry.path).relative_to(base_dir))
            is_doc = entry.name.endswith(".gdoc") or entry.name.endswith(".doc") or entry.name.endswith(".docx")
            
            items.append({
                "name": entry.name,
                "path": rel_path,
                "is_dir": entry.is_dir(),
                "size": stat.st_size if not entry.is_dir() else 0,
                "modified": datetime.fromtimestamp(stat.st_mtime).isoformat(),
                "is_gdoc": is_doc,
                "extension": Path(entry.name).suffix.lower()
            })
    except PermissionError:
        pass

    # Sort directories first, then alphabetically
    items.sort(key=lambda x: (not x["is_dir"], x["name"].lower()))

    rel_current = "" if target_dir == base_dir else str(target_dir.relative_to(base_dir))
    return {
        "current_path": rel_current,
        "base_path": str(base_dir),
        "exists": True,
        "items": items
    }

def read_file_content(subpath: str) -> Dict[str, Any]:
    file_path = get_safe_path(subpath)
    if not file_path.exists() or file_path.is_dir():
        return {"error": "File not found or is a directory", "found": False}

    mime, _ = mimetypes.guess_type(str(file_path))
    content = ""
    is_binary = False
    
    try:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
    except UnicodeDecodeError:
        is_binary = True
        content = f"[Binary file: {file_path.name} ({file_path.stat().st_size} bytes)]"

    return {
        "found": True,
        "name": file_path.name,
        "path": subpath,
        "size": file_path.stat().st_size,
        "modified": datetime.fromtimestamp(file_path.stat().st_mtime).isoformat(),
        "mime_type": mime or "text/plain",
        "is_binary": is_binary,
        "content": content
    }

def write_file_content(subpath: str, content: str) -> Dict[str, Any]:
    file_path = get_safe_path(subpath)
    file_path.parent.mkdir(parents=True, exist_ok=True)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    return {
        "success": True,
        "name": file_path.name,
        "path": subpath,
        "size": file_path.stat().st_size
    }

def delete_file(subpath: str) -> Dict[str, Any]:
    file_path = get_safe_path(subpath)
    if not file_path.exists():
        return {"success": False, "error": "Path does not exist"}
    if file_path.is_dir():
        import shutil
        shutil.rmtree(file_path)
    else:
        file_path.unlink()
    return {"success": True, "path": subpath}

def seed_sample_university_docs() -> Dict[str, Any]:
    """Generates university project starter docs if drive is empty."""
    base = get_active_drive_path()
    base.mkdir(parents=True, exist_ok=True)
    
    # 1. Research Proposal Doc
    proposal_path = base / "University_Research_Proposal.gdoc"
    if not proposal_path.exists():
        proposal_content = json.dumps({
            "title": "Autonomous LLM Cloud-Edge Compute Orchestration in MCore",
            "author": "Aminul / AI Systems Laboratory",
            "course": "Distributed Autonomous AI Systems 2026",
            "abstract": "Investigating zero-overhead task partitioning across multi-node Linux kernels and cloud Vertex AI endpoints.",
            "sections": [
                {"heading": "1. Introduction", "body": "Edge devices require streamlined data ingress through Google Drive and localized sandboxes."},
                {"heading": "2. Threat Model", "body": "Enforcing isolation policies through network namespaces (mcore-ns) and strict credential fencing."},
                {"heading": "3. Methodology", "body": "Real-time evaluation with Python 3.14 runtimes, Colab drivemount synchronization, and interactive web visualization."}
            ],
            "last_synced": datetime.now().isoformat()
        }, indent=2)
        proposal_path.write_text(proposal_content, encoding="utf-8")

    # 2. Project Notes Markdown
    notes_path = base / "Project_Notes.md"
    if not notes_path.exists():
        notes_path.write_text("""# sboxdrive-gdocs University Project Notes

## Objective
Provide an interactive web-controlled sandbox (`sboxdrive-gdocs`) for running Python scripts against Google Drive documents and datasets mounted from Google Colab.

## Mounted Path
- Colab Mount Target: `/content/drive`
- Default Subfolder: `/content/drive/MyDrive/`

## Key Capabilities
1. Automatic Drive mounting via `colab drivemount /content/drive`.
2. Secure Python 3.14 execution sandbox.
3. Live document editing, visualization, and JSON/CSV dataset processing.
""", encoding="utf-8")

    # 3. Sample Dataset CSV
    data_path = base / "experiment_telemetry.csv"
    if not data_path.exists():
        data_path.write_text("""epoch,accuracy,loss,latency_ms,drive_throughput_mbps
1,0.724,0.612,14.2,45.8
2,0.819,0.453,13.8,52.1
3,0.887,0.312,13.5,61.4
4,0.932,0.201,12.9,64.2
5,0.965,0.118,12.7,68.9
""", encoding="utf-8")

    return list_drive_files("")
