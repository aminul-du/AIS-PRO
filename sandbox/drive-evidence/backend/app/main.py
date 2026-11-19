import sys
from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from .config import PYTHON_EXECUTABLE, BASE_DIR, get_active_drive_path
from .colab_bridge import check_mount_status, trigger_drive_mount
from .drive_service import (
    list_drive_files,
    read_file_content,
    write_file_content,
    delete_file,
    seed_sample_university_docs,
)
from .sandbox import execute_sandbox_code
from fastapi.staticfiles import StaticFiles
from apps.api.main import (
    health_check as mte_health_check,
    handle_query as mte_handle_query,
    QueryRequest as MteQueryRequest,
    QueryResponse as MteQueryResponse,
)

app = FastAPI(
    title="sboxdrive-gdocs API",
    description="Python 3.14 Sandbox and Google Drive/Docs synchronization backend for university research.",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class MountRequest(BaseModel):
    mount_path: Optional[str] = "/content/drive"

class FileSaveRequest(BaseModel):
    path: str
    content: str

class SandboxRunRequest(BaseModel):
    code: str
    timeout_seconds: Optional[int] = 20

@app.get("/api/status")
def get_system_status():
    mount_info = check_mount_status()
    return {
        "status": "online",
        "app_name": "sboxdrive-gdocs",
        "python_version": sys.version,
        "python_executable": PYTHON_EXECUTABLE,
        "mount": mount_info,
    }

@app.post("/api/colab/mount")
def mount_colab_drive(req: MountRequest):
    result = trigger_drive_mount(req.mount_path)
    return result

@app.get("/api/drive/files")
def get_files(path: str = Query("", description="Relative path in drive")):
    return list_drive_files(path)

@app.get("/api/drive/file")
def get_file(path: str = Query(..., description="Relative path to file")):
    res = read_file_content(path)
    if not res.get("found"):
        raise HTTPException(status_code=404, detail="File not found")
    return res

@app.post("/api/drive/file")
def save_file(req: FileSaveRequest):
    return write_file_content(req.path, req.content)

@app.delete("/api/drive/file")
def remove_file(path: str = Query(..., description="Relative path to file")):
    res = delete_file(path)
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@app.post("/api/sandbox/run")
def run_sandbox(req: SandboxRunRequest):
    return execute_sandbox_code(req.code, timeout_seconds=req.timeout_seconds)

@app.post("/api/sample/seed")
def seed_sample_data():
    return seed_sample_university_docs()

@app.get("/health")
def health_endpoint():
    return mte_health_check()

@app.post("/api/v1/query", response_model=MteQueryResponse)
def query_endpoint(req: MteQueryRequest):
    return mte_handle_query(req)

# Mount academic presentation
presentation_dir = BASE_DIR / "presentation"
if presentation_dir.exists():
    app.mount("/presentation", StaticFiles(directory=str(presentation_dir), html=True), name="presentation")

# Mount frontend production build if available
frontend_dist = BASE_DIR / "frontend" / "dist"
if frontend_dist.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dist), html=True), name="frontend")
else:
    @app.get("/")
    def index():
        return {
            "message": "sboxdrive-gdocs Python 3.14 Backend Running",
            "docs_url": "/docs",
            "presentation_url": "/presentation",
            "status_url": "/api/status",
        }
