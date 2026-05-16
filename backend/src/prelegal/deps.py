import os
import sqlite3
from pathlib import Path
from typing import Annotated

from fastapi import Cookie, Depends, HTTPException

from .auth import SESSION_COOKIE, User, _user_from_session
from .db import get_connection


def _db_path() -> Path:
    return Path(os.getenv("PRELEGAL_DB_PATH", "/data/prelegal.db"))


def get_db():
    conn = get_connection(_db_path())
    try:
        yield conn
    finally:
        conn.close()


def get_current_user(
    session_id: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
    conn: sqlite3.Connection = Depends(get_db),
) -> User | None:
    return _user_from_session(conn, session_id)


def require_user(
    user: Annotated[User | None, Depends(get_current_user)],
) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Authentication required")
    return user
