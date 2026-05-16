import sqlite3

import pytest

from prelegal.main import STATIC_DIR


def test_health(client):
    c, _ = client
    r = c.get("/api/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


def test_users_table_created(client):
    _, db_path = client
    with sqlite3.connect(db_path) as conn:
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name='users'"
        )
        assert cur.fetchone() is not None
        cols = {row[1] for row in conn.execute("PRAGMA table_info(users)")}
    assert {"id", "name", "email", "created_at"}.issubset(cols)


def test_db_recreated_on_each_boot(tmp_path, monkeypatch):
    """init_db drops and recreates the file — stale rows must not survive."""
    from prelegal.db import init_db

    db_path = tmp_path / "prelegal.db"
    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        conn.execute(
            "INSERT INTO users (name, email) VALUES (?, ?)", ("Alice", "a@example.com")
        )
        conn.commit()
        assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 1

    init_db(db_path)
    with sqlite3.connect(db_path) as conn:
        assert conn.execute("SELECT COUNT(*) FROM users").fetchone()[0] == 0


def test_static_index_served_when_built(client):
    if not (STATIC_DIR / "index.html").is_file():
        pytest.skip("frontend not built into static/")
    c, _ = client
    r = c.get("/")
    assert r.status_code == 200
    assert b"<html" in r.content.lower()


def test_login_route_served_when_built(client):
    if not (STATIC_DIR / "login" / "index.html").is_file():
        pytest.skip("frontend not built into static/")
    c, _ = client
    r = c.get("/login/")
    assert r.status_code == 200
    assert b"sign in" in r.content.lower()


def test_unknown_api_path_returns_json_404(client):
    """Unknown /api paths must not fall through to the static frontend mount."""
    c, _ = client
    r = c.get("/api/does-not-exist")
    assert r.status_code == 404
    assert r.headers["content-type"].startswith("application/json")
