# sboxdrive-gdocs

> **University Autonomous Systems Project**
> Python 3.14 Sandbox & Google Drive / Google Docs Web Interface with Colab Drive Integration

---

## Architecture Overview

`sboxdrive-gdocs` bridges Google Colab runtime storage (`/content/drive`) with a Python 3.14 execution sandbox and an interactive TypeScript + Tailwind CSS v4 web dashboard.

```
                    +------------------------------------------+
                    |           Colab Environment              |
                    |   colab drivemount /content/drive        |
                    +--------------------+---------------------+
                                         |
                                         v
                         +---------------+---------------+
                         |   /content/drive (Google Docs)|
                         |   (Fallback: ./sample_drive)  |
                         +---------------+---------------+
                                         |
        +--------------------------------+--------------------------------+
        |                                                                 |
        v                                                                 v
+-------+-------------------------+                     +-----------------+-----------------------+
|  sboxdrive-gdocs Python Backend |                     |  sboxdrive-gdocs Frontend (TypeScript)  |
|  - Python 3.14.10               | <--- REST API ----> |  - React 19 + Vite                      |
|  - FastAPI                      |      (/api/*)       |  - Tailwind CSS 4                       |
|  - Colab CLI Bridge             |                     |  - Google Docs / Telemetry Viewer       |
|  - Isolated Code Sandbox        |                     |  - Interactive Code Runner              |
+---------------------------------+                     +-----------------------------------------+
```

---

## Tech Stack

* **Backend**: Python 3.14.10, FastAPI, Uvicorn, Pydantic v2
* **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4 (`@tailwindcss/vite`), Lucide Icons
* **Storage Mount**: Google Colab Drive Mount (`/content/drive`) with automatic local sandbox mock fallback (`./sample_drive`)
* **Package Management**: Astral `uv` for Python 3.14 venv, `npm` for frontend

---

## Quick Start

### 1. Launch in Unified Production Mode (Port 8000)
Serves both the FastAPI backend and compiled React + Tailwind CSS 4 frontend on a single port:

```bash
cd /home/mcoreai/sboxdrive-gdocs
./start.sh
```
Open **`http://localhost:8000`** in your browser.

### 2. Launch in Live Development Mode (HMR)
Runs the backend with auto-reload on port 8000 and the Vite frontend with hot module replacement on port 5173:

```bash
cd /home/mcoreai/sboxdrive-gdocs
./start.sh --dev
```
Open **`http://localhost:5173`** (Vite proxies `/api` calls to port 8000 automatically).

---

## Key Features

1. **Colab Drive Mount Controller**:
   * Triggers `colab drivemount /content/drive` directly from the dashboard via the installed `colab` CLI.
   * Auto-detects whether the host is running in a live Colab VM or local Linux environment.
   * Gracefully falls back to a persistent `./sample_drive` workspace when testing locally.

2. **Google Drive & Docs Explorer**:
   * Visual directory tree with file metadata (size, timestamps, format).
   * Parses structured Google Docs (`.gdoc`) into structured research sections (Abstract, Introduction, Methodology).
   * Live in-browser document and code editing with instant save.

3. **Isolated Python 3.14 Sandbox**:
   * Executes arbitrary Python code against `DRIVE_PATH` with timeout enforcement.
   * Built-in university project snippets (Directory scanning, Google Doc parsing, CSV telemetry analysis).
   * Live console output showing execution duration, exit codes, stdout, and stderr.

---

## API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/status` | Reports Python version, Colab CLI status, and active mount path |
| `POST` | `/api/colab/mount` | Executes `colab drivemount` with target mount path |
| `GET` | `/api/drive/files` | Lists files and directories in current drive scope |
| `GET` | `/api/drive/file` | Reads file content and parses `.gdoc` structures |
| `POST` | `/api/drive/file` | Saves or updates a file in the drive |
| `DELETE`| `/api/drive/file` | Removes a file from the drive |
| `POST` | `/api/sandbox/run` | Runs Python 3.14 script inside the sandbox |
| `POST` | `/api/sample/seed` | Generates sample university proposal & telemetry dataset |
