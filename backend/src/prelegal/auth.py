import datetime
import secrets
import sqlite3

import bcrypt
from pydantic import BaseModel

SESSION_COOKIE = "prelegal_session"
SESSION_TTL_SECONDS = 60 * 60 * 24 * 7  # 7 days


class User(BaseModel):
    id: int
    name: str
    email: str


def hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
    except ValueError:
        return False


def create_session(conn: sqlite3.Connection, user_id: int) -> str:
    sid = secrets.token_urlsafe(32)
    expires = _utc_now() + datetime.timedelta(seconds=SESSION_TTL_SECONDS)
    conn.execute(
        "INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)",
        (sid, user_id, expires.isoformat()),
    )
    conn.commit()
    return sid


def delete_session(conn: sqlite3.Connection, session_id: str) -> None:
    conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
    conn.commit()


def _user_from_session(
    conn: sqlite3.Connection, session_id: str | None
) -> User | None:
    if not session_id:
        return None
    row = conn.execute(
        "SELECT u.id, u.name, u.email, s.expires_at "
        "FROM sessions s JOIN users u ON u.id = s.user_id "
        "WHERE s.id = ?",
        (session_id,),
    ).fetchone()
    if not row:
        return None
    if datetime.datetime.fromisoformat(row["expires_at"]) < _utc_now():
        conn.execute("DELETE FROM sessions WHERE id = ?", (session_id,))
        conn.commit()
        return None
    return User(id=row["id"], name=row["name"], email=row["email"])


def _utc_now() -> datetime.datetime:
    return datetime.datetime.now(datetime.UTC).replace(tzinfo=None)
