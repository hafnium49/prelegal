import json
import sqlite3
from typing import Annotated, Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from ..auth import User
from ..deps import get_db, require_user

router = APIRouter(prefix="/my-documents")


class DocumentSummary(BaseModel):
    id: int
    document_type: str | None
    title: str
    updated_at: str


class DocumentRead(DocumentSummary):
    form_state: dict[str, Any]
    created_at: str


class DocumentUpsert(BaseModel):
    document_type: str | None = None
    title: str = Field(min_length=1, max_length=200)
    form_state: dict[str, Any]


@router.get("", response_model=list[DocumentSummary])
def list_my_documents(
    user: Annotated[User, Depends(require_user)],
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> list[DocumentSummary]:
    rows = conn.execute(
        "SELECT id, document_type, title, updated_at FROM documents "
        "WHERE user_id = ? ORDER BY updated_at DESC",
        (user.id,),
    ).fetchall()
    return [DocumentSummary(**dict(row)) for row in rows]


@router.post("", response_model=DocumentRead, status_code=201)
def create_my_document(
    payload: DocumentUpsert,
    user: Annotated[User, Depends(require_user)],
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> DocumentRead:
    cur = conn.execute(
        "INSERT INTO documents (user_id, document_type, title, form_state) "
        "VALUES (?, ?, ?, ?)",
        (user.id, payload.document_type, payload.title, json.dumps(payload.form_state)),
    )
    conn.commit()
    return _fetch_one(conn, user.id, cur.lastrowid)


@router.get("/{doc_id}", response_model=DocumentRead)
def get_my_document(
    doc_id: int,
    user: Annotated[User, Depends(require_user)],
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> DocumentRead:
    return _fetch_one(conn, user.id, doc_id)


@router.put("/{doc_id}", response_model=DocumentRead)
def update_my_document(
    doc_id: int,
    payload: DocumentUpsert,
    user: Annotated[User, Depends(require_user)],
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> DocumentRead:
    cur = conn.execute(
        "UPDATE documents SET document_type = ?, title = ?, form_state = ?, "
        "updated_at = datetime('now') WHERE id = ? AND user_id = ?",
        (
            payload.document_type,
            payload.title,
            json.dumps(payload.form_state),
            doc_id,
            user.id,
        ),
    )
    conn.commit()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Document not found")
    return _fetch_one(conn, user.id, doc_id)


@router.delete("/{doc_id}", status_code=204)
def delete_my_document(
    doc_id: int,
    user: Annotated[User, Depends(require_user)],
    conn: Annotated[sqlite3.Connection, Depends(get_db)],
) -> None:
    cur = conn.execute(
        "DELETE FROM documents WHERE id = ? AND user_id = ?", (doc_id, user.id)
    )
    conn.commit()
    if cur.rowcount == 0:
        raise HTTPException(status_code=404, detail="Document not found")


def _fetch_one(
    conn: sqlite3.Connection, user_id: int, doc_id: int
) -> DocumentRead:
    row = conn.execute(
        "SELECT id, document_type, title, form_state, created_at, updated_at "
        "FROM documents WHERE id = ? AND user_id = ?",
        (doc_id, user_id),
    ).fetchone()
    if not row:
        raise HTTPException(status_code=404, detail="Document not found")
    data = dict(row)
    data["form_state"] = json.loads(data["form_state"])
    return DocumentRead(**data)
