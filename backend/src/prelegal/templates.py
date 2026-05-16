import os
from functools import lru_cache
from pathlib import Path


def _templates_dir() -> Path:
    override = os.getenv("PRELEGAL_TEMPLATES_DIR")
    if override:
        return Path(override)
    container_path = Path("/app/templates")
    if container_path.is_dir():
        return container_path
    return Path(__file__).resolve().parents[3] / "templates"


@lru_cache(maxsize=64)
def _read_cached(filename: str) -> str:
    return (_templates_dir() / filename).read_text(encoding="utf-8")


def read_template(filename: str) -> str:
    path = _templates_dir() / filename
    if not path.is_file():
        # Don't cache misses — a misconfigured templates dir should fail loudly
        # on every request rather than silently caching "" forever.
        return ""
    return _read_cached(filename)
