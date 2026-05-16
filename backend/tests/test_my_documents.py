SAMPLE_FORM = {
    "document_type": "mutual_nda",
    "field_values": {"purpose": "evaluate partnership"},
    "parties": [{"company": "Acme"}, None],
}


def test_list_returns_empty_initially(auth_client):
    c, _ = auth_client
    r = c.get("/api/my-documents")
    assert r.status_code == 200
    assert r.json() == []


def test_create_then_get(auth_client):
    c, _ = auth_client
    r = c.post(
        "/api/my-documents",
        json={
            "document_type": "mutual_nda",
            "title": "Acme MNDA",
            "form_state": SAMPLE_FORM,
        },
    )
    assert r.status_code == 201, r.text
    created = r.json()
    assert created["title"] == "Acme MNDA"
    assert created["form_state"] == SAMPLE_FORM

    r2 = c.get(f"/api/my-documents/{created['id']}")
    assert r2.status_code == 200
    assert r2.json()["form_state"] == SAMPLE_FORM


def test_update_overwrites_form_state(auth_client):
    c, _ = auth_client
    created = c.post(
        "/api/my-documents",
        json={
            "document_type": "mutual_nda",
            "title": "Acme MNDA",
            "form_state": SAMPLE_FORM,
        },
    ).json()
    new_state = {**SAMPLE_FORM, "field_values": {"purpose": "updated"}}
    r = c.put(
        f"/api/my-documents/{created['id']}",
        json={
            "document_type": "mutual_nda",
            "title": "Acme MNDA v2",
            "form_state": new_state,
        },
    )
    assert r.status_code == 200
    assert r.json()["title"] == "Acme MNDA v2"
    assert r.json()["form_state"]["field_values"]["purpose"] == "updated"


def test_delete_removes_doc(auth_client):
    c, _ = auth_client
    created = c.post(
        "/api/my-documents",
        json={
            "document_type": "mutual_nda",
            "title": "Acme MNDA",
            "form_state": SAMPLE_FORM,
        },
    ).json()
    r = c.delete(f"/api/my-documents/{created['id']}")
    assert r.status_code == 204
    assert c.get(f"/api/my-documents/{created['id']}").status_code == 404


def test_user_cannot_see_other_users_docs(client):
    c, _ = client
    # User A
    c.post(
        "/api/auth/register",
        json={"name": "A", "email": "a@x.com", "password": "passw0rd-aaa"},
    )
    a_doc = c.post(
        "/api/my-documents",
        json={"document_type": "mutual_nda", "title": "A doc", "form_state": SAMPLE_FORM},
    ).json()
    c.post("/api/auth/logout")
    c.cookies.clear()
    # User B
    c.post(
        "/api/auth/register",
        json={"name": "B", "email": "b@x.com", "password": "passw0rd-bbb"},
    )
    assert c.get("/api/my-documents").json() == []
    assert c.get(f"/api/my-documents/{a_doc['id']}").status_code == 404


def test_unauthenticated_get_returns_401(client):
    c, _ = client
    assert c.get("/api/my-documents").status_code == 401
    assert (
        c.post(
            "/api/my-documents",
            json={"title": "x", "form_state": {}},
        ).status_code
        == 401
    )
