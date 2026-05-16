import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import health

STATIC_DIR = Path(__file__).parent / "static"


def _db_path() -> Path:
    return Path(os.getenv("PRELEGAL_DB_PATH", "/data/prelegal.db"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db(_db_path())
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Prelegal", lifespan=lifespan)
    app.include_router(health.router, prefix="/api")

    # Each frontend route is exported to its own index.html (Next.js
    # `trailingSlash: true`), so StaticFiles with html=True covers reloads
    # at `/` and `/login/` directly. Unknown paths fall through to Next's
    # generated 404.html, which is the intended UX.
    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    return app


app = create_app()
