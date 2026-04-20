# Monitoring-anonymiser GitHub Pages App

This package is a **static browser app** designed to work on **GitHub Pages**.

## What it now includes
- Upload files or folders in the browser
- Process `.docx`, `.pdf`, `.txt`, `.xlsx`
- Apply consistent anonymisation replacements
- Choose exactly **what categories to anonymise**
- Use a **Recommended** preset for EUAA monitoring demonstrations
- Redact **PDFs with black bars** while keeping the original PDF layout where possible
- Download anonymised outputs as DOCX, PDF, TXT, and XLSX where applicable
- Export a ZIP of all generated files
- Keep file contents in browser memory only

## Key new PDF option
For PDFs, you can now choose:
- **Anonymise and rebuild output**
- **Redact original PDF with black bars**

The black-bar mode is intended for text-searchable PDFs and preserves the visual document much more closely by drawing black redaction bars over detected identifiable text.

## Important limitations
- PDF black-bar mode works best for text-searchable PDFs
- Scanned PDFs are not OCR processed in this version
- DOCX/PDF structure is simplified when regenerated client-side in rebuild mode
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
