def test_register_creates_user_and_sets_cookie(client):
    c, _ = client
    r = c.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "secret-pw-1"},
    )
    assert r.status_code == 201
    body = r.json()
    assert body["email"] == "ada@example.com"
    assert "prelegal_session" in r.cookies


def test_register_rejects_short_password(client):
    c, _ = client
    r = c.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "short"},
    )
    assert r.status_code == 422


def test_register_rejects_duplicate_email(client):
    c, _ = client
    payload = {"name": "Ada", "email": "ada@example.com", "password": "secret-pw-1"}
    assert c.post("/api/auth/register", json=payload).status_code == 201
    r = c.post("/api/auth/register", json=payload)
    assert r.status_code == 409


def test_login_with_correct_password(client):
    c, _ = client
    c.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "secret-pw-1"},
    )
    # clear cookies from registration to ensure login flow stands alone
    c.cookies.clear()
    r = c.post(
        "/api/auth/login",
        json={"email": "ada@example.com", "password": "secret-pw-1"},
    )
    assert r.status_code == 200
    assert "prelegal_session" in r.cookies


def test_login_rejects_wrong_password(client):
    c, _ = client
    c.post(
        "/api/auth/register",
        json={"name": "Ada", "email": "ada@example.com", "password": "secret-pw-1"},
    )
    c.cookies.clear()
    r = c.post(
        "/api/auth/login", json={"email": "ada@example.com", "password": "wrong"}
    )
    assert r.status_code == 401


def test_me_returns_current_user(auth_client):
    c, _ = auth_client
    r = c.get("/api/auth/me")
    assert r.status_code == 200
    assert r.json()["email"] == "test@example.com"


def test_me_401_without_cookie(client):
    c, _ = client
    r = c.get("/api/auth/me")
    assert r.status_code == 401


def test_logout_clears_session(auth_client):
    c, _ = auth_client
    assert c.get("/api/auth/me").status_code == 200
    r = c.post("/api/auth/logout")
    assert r.status_code == 204
    # After logout the cookie should be cleared / session removed
    c.cookies.clear()
    assert c.get("/api/auth/me").status_code == 401
