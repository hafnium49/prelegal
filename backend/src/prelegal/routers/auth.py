import os
import sqlite3
from typing import Annotated

from fastapi import APIRouter, Cookie, Depends, HTTPException, Response
from pydantic import BaseModel, Field, field_validator

from ..auth import (
    SESSION_COOKIE,
    SESSION_TTL_SECONDS,
    User,
    create_session,
    delete_session,
    hash_password,
    verify_password,
)
from ..deps import get_current_user, get_db

router = APIRouter(prefix="/auth")

# Reading once is fine — env vars don't change mid-process. Set to "true" when
# serving over HTTPS in production so the cookie is not sent over plain HTTP.
COOKIE_SECURE = os.getenv("PRELEGAL_COOKIE_SECURE", "false").lower() == "true"


class RegisterIn(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = Field(min_length=3, max_length=200)
    password: str = Field(min_length=8, max_length=200)

    @field_validator("email")
    @classmethod
    def _normalize_email(cls, v: str) -> str:
        v = v.strip().lower()
        if "@" not in v or "." not in v.split("@", 1)[-1]:
            raise ValueError("Invalid email address")
        return v


class LoginIn(BaseModel):
    email: str
    password: str


def _set_session_cookie(response: Response, session_id: str) -> None:
    response.set_cookie(
        key=SESSION_COOKIE,
        value=session_id,
        max_age=SESSION_TTL_SECONDS,
        httponly=True,
        samesite="lax",
        secure=COOKIE_SECURE,
        path="/",
    )


@router.post("/register", response_model=User, status_code=201)
def register(
    payload: RegisterIn,
    response: Response,
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> User:
    try:
        cur = conn.execute(
            "INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)",
            (payload.name.strip(), payload.email, hash_password(payload.password)),
        )
        conn.commit()
    except sqlite3.IntegrityError:
        raise HTTPException(status_code=409, detail="Email already registered")
    user_id = cur.lastrowid
    sid = create_session(conn, user_id)
    _set_session_cookie(response, sid)
    return User(id=user_id, name=payload.name.strip(), email=payload.email)


@router.post("/login", response_model=User)
def login(
    payload: LoginIn,
    response: Response,
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> User:
    row = conn.execute(
        "SELECT id, name, email, password_hash FROM users WHERE email = ?",
        (payload.email.lower().strip(),),
    ).fetchone()
    if not row or not verify_password(payload.password, row["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    sid = create_session(conn, row["id"])
    _set_session_cookie(response, sid)
    return User(id=row["id"], name=row["name"], email=row["email"])


@router.post("/logout", status_code=204)
def logout(
    response: Response,
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
    session_id: Annotated[str | None, Cookie(alias=SESSION_COOKIE)] = None,
) -> None:
    if session_id:
        delete_session(conn, session_id)
    response.delete_cookie(SESSION_COOKIE, path="/")


@router.get("/me", response_model=User)
def me(user: Annotated[User | None, Depends(get_current_user)]) -> User:
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return user
