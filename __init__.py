from pathlib import Path
import tempfile

APP_NAME = "EUAA Case File Anonymiser"
TEMP_ROOT = Path(tempfile.gettempdir()) / "euaa_case_file_anonymiser"
MAX_FILE_SIZE_MB = 50
SUPPORTED_EXTENSIONS = {".docx", ".pdf", ".txt", ".xlsx"}
ANONYMISATION_LEVELS = {"light", "standard", "demo-safe"}
