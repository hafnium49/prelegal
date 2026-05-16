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
