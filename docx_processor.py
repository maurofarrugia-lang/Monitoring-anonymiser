from pathlib import Path
import shutil


def safe_suffix(path: Path) -> str:
    return path.suffix.lower()


def ensure_clean_dir(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)
    path.mkdir(parents=True, exist_ok=True)


def purge_path(path: Path) -> None:
    if path.exists():
        shutil.rmtree(path, ignore_errors=True)


def is_supported(path: Path) -> bool:
    return safe_suffix(path) in {'.docx', '.pdf', '.txt', '.xlsx'}
