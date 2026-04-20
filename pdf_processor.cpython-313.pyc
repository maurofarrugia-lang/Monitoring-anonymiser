from pathlib import Path

import fitz

from app.anonymizer.service import AnonymisationService
from app.processors.base import ProcessedArtifact
from app.utils.exporters import text_to_docx


class PdfProcessor:
    def process(self, input_path: Path, output_dir: Path, service: AnonymisationService) -> ProcessedArtifact:
        doc = fitz.open(str(input_path))
        preview_parts: list[str] = []

        for page in doc:
            page_text = page.get_text("text")
            if not page_text.strip():
                continue
            result = service.anonymize_text(page_text)
            preview_parts.append(result.anonymized_text)
            replacements = {}
            for entity in result.entities:
                replacements[entity["original"]] = entity["replacement"]
            for original, replacement in sorted(replacements.items(), key=lambda i: len(i[0]), reverse=True):
                if not original.strip():
                    continue
                rects = page.search_for(original)
                for rect in rects:
                    page.add_redact_annot(rect, text=replacement, fill=(1, 1, 1), text_color=(0, 0, 0))
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

        stem = input_path.stem + "_anonymised"
        pdf_path = output_dir / f"{stem}.pdf"
        docx_path = output_dir / f"{stem}.docx"
        doc.save(str(pdf_path), garbage=4, deflate=True)
        preview_text = "\n\n".join(preview_parts)
        text_to_docx(preview_text, docx_path, title=input_path.name)
        doc.close()
        return ProcessedArtifact(input_path=input_path, output_files=[pdf_path, docx_path], preview_text=preview_text[:3000])
