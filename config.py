from __future__ import annotations

import shutil
import uuid
from pathlib import Path

from fastapi import FastAPI, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import FileResponse, HTMLResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from app.anonymizer.service import AnonymisationService
from app.config import ANONYMISATION_LEVELS, APP_NAME, SUPPORTED_EXTENSIONS, TEMP_ROOT
from app.processors.docx_processor import DocxProcessor
from app.processors.pdf_processor import PdfProcessor
from app.processors.txt_processor import TxtProcessor
from app.processors.xlsx_processor import XlsxProcessor
from app.utils.exporters import zip_folder
from app.utils.files import ensure_clean_dir, purge_path

app = FastAPI(title=APP_NAME)
app.mount("/static", StaticFiles(directory="app/static"), name="static")
templates = Jinja2Templates(directory="app/templates")

SESSIONS: dict[str, dict] = {}
PROCESSORS = {
    ".txt": TxtProcessor(),
    ".docx": DocxProcessor(),
    ".xlsx": XlsxProcessor(),
    ".pdf": PdfProcessor(),
}


@app.on_event("startup")
def startup_cleanup() -> None:
    ensure_clean_dir(TEMP_ROOT)


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    return templates.TemplateResponse(
        request,
        "index.html",
        {"request": request, "app_name": APP_NAME, "sessions": SESSIONS},
    )


@app.post("/process")
async def process_files(request: Request, files: list[UploadFile] = File(...), level: str = Form("demo-safe")):
    if level not in ANONYMISATION_LEVELS:
        raise HTTPException(status_code=400, detail="Invalid anonymisation level")

    session_id = uuid.uuid4().hex
    session_root = TEMP_ROOT / session_id
    input_dir = session_root / "input"
    output_dir = session_root / "output"
    ensure_clean_dir(input_dir)
    ensure_clean_dir(output_dir)

    service = AnonymisationService(level=level)
    processed = []

    try:
        for upload in files:
            filename = Path(upload.filename or "uploaded_file")
            relative_path = filename.as_posix().lstrip("/")
            suffix = filename.suffix.lower()
            if suffix not in SUPPORTED_EXTENSIONS:
                continue

            target_path = input_dir / relative_path
            target_path.parent.mkdir(parents=True, exist_ok=True)
            with target_path.open("wb") as f:
                shutil.copyfileobj(upload.file, f)

            processor = PROCESSORS[suffix]
            artifact_dir = output_dir / target_path.parent.relative_to(input_dir)
            artifact_dir.mkdir(parents=True, exist_ok=True)
            artifact = processor.process(target_path, artifact_dir, service)
            processed.append(
                {
                    "source": relative_path,
                    "outputs": [str(p.relative_to(output_dir)) for p in artifact.output_files],
                    "preview": artifact.preview_text,
                }
            )
    finally:
        for upload in files:
            await upload.close()

    if not processed:
        purge_path(session_root)
        raise HTTPException(status_code=400, detail="No supported files found")

    zip_path = session_root / f"anonymised_{session_id}.zip"
    zip_folder(output_dir, zip_path)
    SESSIONS[session_id] = {
        "id": session_id,
        "level": level,
        "root": str(session_root),
        "zip": str(zip_path),
        "files": processed,
        "stats": dict(service.entity_map.category_counts),
    }
    return RedirectResponse(url=f"/session/{session_id}", status_code=303)


@app.get("/session/{session_id}", response_class=HTMLResponse)
def get_session(request: Request, session_id: str):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return templates.TemplateResponse(
        request,
        "index.html",
        {"request": request, "app_name": APP_NAME, "sessions": SESSIONS, "active_session": session},
    )


@app.get("/download/{session_id}")
def download_bundle(session_id: str):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    zip_path = Path(session["zip"])
    return FileResponse(zip_path, filename=zip_path.name, media_type="application/zip")


@app.get("/download/{session_id}/file")
def download_file(session_id: str, path: str):
    session = SESSIONS.get(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    full_path = Path(session["root"]) / "output" / Path(path)
    if not full_path.exists() or not full_path.is_file():
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path, filename=full_path.name)


@app.post("/cleanup/{session_id}")
def cleanup_session(session_id: str):
    session = SESSIONS.pop(session_id, None)
    if session:
        purge_path(Path(session["root"]))
    return RedirectResponse(url="/", status_code=303)
