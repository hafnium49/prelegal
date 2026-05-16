from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from .db import init_db
from .deps import _db_path
from .routers import auth, catalog, chat, health, my_documents

STATIC_DIR = Path(__file__).parent / "static"


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db(_db_path())
    yield


def create_app() -> FastAPI:
    load_dotenv()
    app = FastAPI(title="Prelegal", lifespan=lifespan)

    # Dev frontend (`npm run dev` on :3000) needs CORS + credentials so the
    # session cookie travels across origins. Production is same-origin and
    # this middleware is a no-op.
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:3000"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, prefix="/api")
    app.include_router(auth.router, prefix="/api")
    app.include_router(catalog.router, prefix="/api")
    app.include_router(my_documents.router, prefix="/api")
    app.include_router(chat.router, prefix="/api")

    @app.api_route(
        "/api/{_path:path}", methods=["GET", "POST", "PUT", "DELETE", "PATCH"]
    )
    async def api_not_found(_path: str):
        raise HTTPException(status_code=404, detail="Not Found")

    if STATIC_DIR.is_dir():
        app.mount("/", StaticFiles(directory=STATIC_DIR, html=True), name="static")

    return app


app = create_app()
