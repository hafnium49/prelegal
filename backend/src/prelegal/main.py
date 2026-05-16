import os
from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import health

STATIC_DIR = Path(__file__).parent / "static"


def _db_path() -> Path:
    return Path(os.getenv("PRELEGAL_DB_PATH", "/data/prelegal.db"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db(_db_path())
    yield


def create_app() -> FastAPI:
    app = FastAPI(title="Prelegal", lifespan=lifespan)
    app.include_router(health.router, prefix="/api")

    # JSON 404 for unknown /api paths so they don't fall through to the
    # static mount, which would otherwise return Next's HTML 404 page.
    @app.api_route("/api/{_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"])
    async def api_not_found(_path: str):
        raise HTTPException(status_code=404, detail="Not Found")

    # Each frontend route is exported to its own index.html (Next.js
    # `trailingSlash: true`), so html=True covers reloads at `/` and
    # `/login/` directly. Unknown paths fall through to Next's 404.html.
    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    return app


app = create_app()
