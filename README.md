# EUAA Case File Anonymiser

A local-first FastAPI application for batch anonymising folders of case files containing **DOCX, PDF, TXT, and XLSX** materials.

## What this repository does
- Upload a folder or multiple files from your own machine
- Detect and replace direct identifiers such as names, case numbers, IDs, addresses, emails, and phone numbers
- Generalise some indirect identifiers for demonstration-safe outputs
- Preserve useful case-file structure where possible
- Export anonymised outputs as **DOCX**, **PDF**, and **XLSX** where applicable
- Generate a ZIP bundle for download
- Keep all processing local to the machine running the app

## Important scope note
This is an **offline/local MVP**, not a certified legal anonymisation platform. It is designed to help create demo-safe materials for review and demonstration workflows. Human review is still required before external use.

## Tech stack
- FastAPI UI and local HTTP server
- python-docx for Word handling
- PyMuPDF for PDF text extraction and redaction overlays
- openpyxl for Excel handling
- reportlab for local PDF generation
- optional Microsoft Presidio integration for extra entity detection

## Quick start

### 1. Create a virtual environment
```bash
python -m venv .venv
source .venv/bin/activate
```

### 2. Install dependencies
```bash
pip install -r requirements.txt
```

### 3. Run the app
```bash
uvicorn app.main:app --reload
```

Open `http://127.0.0.1:8000`

## Docker run
```bash
docker compose up --build
```

## Supported inputs
- `.docx`
- `.pdf`
- `.txt`
- `.xlsx`

## Privacy model
- No external AI APIs are called
- No remote storage is required
- Temporary session files are created in the local temp directory only
- Use the **Delete session data** button to wipe a session after download
- Startup cleanup clears previous temp sessions

## Recommended production hardening
If you want to turn this into a real internal tool, add:
- local authentication
- stronger custom recognisers per country/language
- better DOCX run-level preservation
- OCR for scanned PDFs using an offline OCR engine
- stricter secure-delete routines per OS
- audit controls and manual review workflow

## Project structure
```text
app/
  anonymizer/
  processors/
  static/
  templates/
  utils/
tests/
```

## Running tests
```bash
pytest
```

## Limitations
- Scanned PDFs are not OCR'd in this MVP
- PDF replacement relies on text-searchable PDFs
- DOCX run formatting may be simplified when text is replaced
- Excel formulas are preserved only when the cell begins with `=`
- Entity recognition is rule-based first, Presidio-assisted when available

## Suggested next improvements
1. Add user-editable substitution review before export
2. Add multilingual recognisers
3. Add offline OCR
4. Wrap as a Tauri desktop app
5. Add better redaction QA reports
