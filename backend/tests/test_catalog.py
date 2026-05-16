def test_list_catalog(client):
    c, _ = client
    r = c.get("/api/catalog")
    assert r.status_code == 200
    docs = r.json()
    ids = {d["id"] for d in docs}
    assert {"mutual_nda", "pilot_agreement", "csa", "sla", "ai_addendum"} <= ids


def test_get_template_known_doc(client):
    c, _ = client
    r = c.get("/api/catalog/mutual_nda/template")
    assert r.status_code == 200
    md = r.json()["markdown"]
    assert "Mutual Non-Disclosure Agreement" in md


def test_get_template_unknown_doc_404(client):
    c, _ = client
    r = c.get("/api/catalog/not_a_real_doc/template")
    assert r.status_code == 404
