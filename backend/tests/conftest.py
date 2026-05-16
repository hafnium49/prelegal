import pytest
from fastapi.testclient import TestClient


@pytest.fixture
def client(tmp_path, monkeypatch):
    db_path = tmp_path / "prelegal.db"
    monkeypatch.setenv("PRELEGAL_DB_PATH", str(db_path))
    from prelegal.main import create_app

    app = create_app()
    with TestClient(app) as c:
        yield c, db_path


@pytest.fixture
def auth_client(client):
    """A test client with a registered + logged-in user. Session cookie persists
    in the underlying TestClient session, so subsequent requests are authed."""
    c, db_path = client
    r = c.post(
        "/api/auth/register",
        json={
            "name": "Test User",
            "email": "test@example.com",
            "password": "test-password-123",
        },
    )
    assert r.status_code == 201, r.text
    yield c, db_path
