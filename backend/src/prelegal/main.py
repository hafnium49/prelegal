import os
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .routers import chat, health

STATIC_DIR = Path(__file__).parent / "static"


def _db_path() -> Path:
    return Path(os.getenv("PRELEGAL_DB_PATH", "/data/prelegal.db"))


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db(_db_path())
    yield


def create_app() -> FastAPI:
    load_dotenv()
    app = FastAPI(title="Prelegal", lifespan=lifespan)

    # Allow the dev-mode frontend (next dev on :3000) to call the API.
    # In production the frontend is served same-origin by FastAPI, so CORS
    # is never exercised.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_methods=["GET", "POST"],
        allow_headers=["Content-Type"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")

    # JSON 404 for unknown /api paths so they don't fall through to the
    # static mount, which would otherwise return Next's HTML 404 page.
    @app.api_route(
        "/api/{_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
    )
    async def api_not_found(_path: str):
        raise HTTPException(status_code=404, detail="Not Found")

    # Each frontend route is exported to its own index.html (Next.js
    # `trailingSlash: true`), so html=True covers reloads at `/` and
    # `/login/` directly. Unknown paths fall through to Next's 404.html.
    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    return app


app = create_app()
