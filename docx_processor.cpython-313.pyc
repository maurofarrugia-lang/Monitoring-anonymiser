from pathlib import Path

from app.anonymizer.service import AnonymisationService
from app.processors.base import ProcessedArtifact
from app.utils.exporters import text_to_docx, text_to_pdf


class TxtProcessor:
    def process(self, input_path: Path, output_dir: Path, service: AnonymisationService) -> ProcessedArtifact:
        original = input_path.read_text(encoding="utf-8", errors="ignore")
        result = service.anonymize_text(original)
        stem = input_path.stem + "_anonymised"
        docx_path = output_dir / f"{stem}.docx"
        pdf_path = output_dir / f"{stem}.pdf"
        text_to_docx(result.anonymized_text, docx_path, title=input_path.name)
        text_to_pdf(result.anonymized_text, pdf_path, title=input_path.name)
        return ProcessedArtifact(input_path=input_path, output_files=[docx_path, pdf_path], preview_text=result.anonymized_text[:3000])
