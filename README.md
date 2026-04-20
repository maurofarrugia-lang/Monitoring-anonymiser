# Monitoring-anonymiser GitHub Pages App

This package is a **static browser app** designed to work on **GitHub Pages**.

## Why this fixes your blank GitHub Pages site
Your earlier package used a Python/FastAPI backend. GitHub Pages can only host **static files** like HTML, CSS, and JavaScript, so the page appeared blank or empty.

This package contains only static files:
- `index.html`
- `style.css`
- `app.js`
- `.nojekyll`

That means it can run directly on GitHub Pages.

## What it does
- Upload files or folders in the browser
- Process `.docx`, `.pdf`, `.txt`, `.xlsx`
- Apply consistent anonymisation replacements
- Download anonymised outputs as DOCX, PDF, TXT, and XLSX where applicable
- Export a ZIP of all generated files
- Keep file contents in browser memory only

## Important limitations
- PDF support works best for text-searchable PDFs
- Scanned PDFs are not OCR processed in this version
- DOCX/PDF structure is simplified when regenerated client-side
- This is a demo-safe browser app, not a certified legal anonymisation system

## How to deploy on GitHub Pages
1. Replace the files in your repository root with this package.
2. Commit and push to GitHub.
3. In GitHub repository settings, open **Pages**.
4. Set source to:
   - **Deploy from a branch**
   - Branch: `main`
   - Folder: `/ (root)`
5. Save and wait for the Pages deployment.

Your site should then load at:
`https://YOUR-USERNAME.github.io/Monitoring-anonymiser/`

## Local preview
You can open `index.html` directly in a browser, or serve locally:

```bash
python3 -m http.server 8080
```

Then open:
`http://127.0.0.1:8080`

## Suggested next improvements
- Add offline OCR for scanned PDFs
- Add a manual entity review editor
- Add exportable anonymisation audit report
- Add multilingual entity dictionaries
