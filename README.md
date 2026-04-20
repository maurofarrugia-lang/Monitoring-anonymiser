# Monitoring-anonymiser GitHub Pages App

This package is a static browser app designed to work on GitHub Pages.

## What it now includes
- Upload files or folders in the browser
- Process `.docx`, `.pdf`, `.txt`, `.xlsx`
- Apply consistent anonymisation replacements
- Choose exactly what categories to anonymise
- Use a Recommended preset for EUAA monitoring demonstrations
- Redact PDFs with black bars while keeping the original PDF layout where possible
- OCR fallback for scanned PDFs directly in the browser
- Download anonymised outputs as DOCX, PDF, TXT, and XLSX where applicable
- Export a ZIP of all generated files
- Keep file contents in browser memory only

## PDF modes
For PDFs, you can choose:
- **Anonymise and rebuild output**
- **Redact original PDF with black bars**

The black-bar mode is intended to preserve the original PDF appearance. OCR fallback helps when PDFs are scanned or image-based.

## Important limitations
- OCR is slower because it runs locally in the browser
- PDF black-bar mode is best-effort for scanned PDFs and strongest on text-searchable PDFs
- DOCX/PDF structure is simplified when regenerated client-side in rebuild mode
- This is a demo-safe browser app, not a certified legal redaction platform

## How to deploy on GitHub Pages
1. Replace the files in your repository root with this package.
2. Commit and push to GitHub.
3. In GitHub repository settings, open Pages.
4. Set source to Deploy from a branch.
5. Choose branch `main` and folder `/ (root)`.
6. Save and wait for the Pages deployment.

## Local preview
```bash
python3 -m http.server 8080
```
Then open `http://127.0.0.1:8080`
