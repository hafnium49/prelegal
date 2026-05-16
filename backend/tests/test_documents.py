def test_list_documents(client):
    c, _ = client
    r = c.get("/api/documents")
    assert r.status_code == 200
    docs = r.json()
    ids = {d["id"] for d in docs}
    # Spot-check a representative subset across the catalog
    assert {"mutual_nda", "pilot_agreement", "csa", "sla", "ai_addendum"} <= ids


def test_get_template_known_doc(client):
    c, _ = client
    r = c.get("/api/documents/mutual_nda/template")
    assert r.status_code == 200
    md = r.json()["markdown"]
    assert "Mutual Non-Disclosure Agreement" in md


def test_get_template_unknown_doc_404(client):
    c, _ = client
    r = c.get("/api/documents/not_a_real_doc/template")
    assert r.status_code == 404
