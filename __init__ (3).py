from dataclasses import dataclass
from pathlib import Path
from typing import Protocol

from app.anonymizer.service import AnonymisationService


@dataclass
class ProcessedArtifact:
    input_path: Path
    output_files: list[Path]
    preview_text: str


class FileProcessor(Protocol):
    def process(self, input_path: Path, output_dir: Path, service: AnonymisationService) -> ProcessedArtifact:
        ...
