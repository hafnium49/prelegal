from unittest.mock import MagicMock, patch


def _fake_completion(content: str):
    fake = MagicMock()
    fake.choices = [MagicMock()]
    fake.choices[0].message.content = content
    return fake


def _payload(reply: str, **updates) -> str:
    """Build a JSON payload like the LLM returns."""
    import json

    form_updates = {"document_type": None, "field_values": {}, "parties": []}
    form_updates.update(updates)
    return json.dumps({"reply": reply, "form_updates": form_updates})


def test_chat_sets_document_type(auth_client):
    c, _ = auth_client
    payload = _payload("Sure, let's do an MNDA.", document_type="mutual_nda")
    with patch("prelegal.llm.completion", return_value=_fake_completion(payload)):
        r = c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "I want an NDA"}],
                "form": {"document_type": None, "field_values": {}, "parties": []},
            },
        )
    assert r.status_code == 200
    assert r.json()["form_updates"]["document_type"] == "mutual_nda"


def test_chat_extracts_field_values(auth_client):
    c, _ = auth_client
    payload = _payload(
        "Got it, recorded the purpose.",
        field_values={"purpose": "evaluate a partnership"},
    )
    with patch("prelegal.llm.completion", return_value=_fake_completion(payload)):
        r = c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "Evaluating a partnership"}],
                "form": {
                    "document_type": "mutual_nda",
                    "field_values": {},
                    "parties": [],
                },
            },
        )
    assert r.status_code == 200
    assert r.json()["form_updates"]["field_values"]["purpose"] == "evaluate a partnership"


def test_chat_extracts_party_updates(auth_client):
    c, _ = auth_client
    payload = _payload(
        "Recorded party 1.",
        parties=[{"company": "Acme Inc."}, None],
    )
    with patch("prelegal.llm.completion", return_value=_fake_completion(payload)):
        r = c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "Party 1 is Acme Inc."}],
                "form": {
                    "document_type": "mutual_nda",
                    "field_values": {},
                    "parties": [None, None],
                },
            },
        )
    assert r.status_code == 200
    parties = r.json()["form_updates"]["parties"]
    assert parties[0]["company"] == "Acme Inc."
    assert parties[1] is None


def test_chat_system_prompt_includes_catalog_when_no_doc(auth_client):
    c, _ = auth_client
    payload = _payload("Which document do you want?")
    with patch(
        "prelegal.llm.completion", return_value=_fake_completion(payload)
    ) as mock_complete:
        c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "Hi"}],
                "form": {"document_type": None, "field_values": {}, "parties": []},
            },
        )
    sys_msg = mock_complete.call_args.kwargs["messages"][0]
    assert sys_msg["role"] == "system"
    assert "mutual_nda" in sys_msg["content"]
    assert "pilot_agreement" in sys_msg["content"]
    assert "No document type selected" in sys_msg["content"]


def test_chat_system_prompt_includes_selected_spec_fields(auth_client):
    c, _ = auth_client
    payload = _payload("What is the purpose?")
    with patch(
        "prelegal.llm.completion", return_value=_fake_completion(payload)
    ) as mock_complete:
        c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "I want an NDA"}],
                "form": {
                    "document_type": "mutual_nda",
                    "field_values": {"governingLaw": "Delaware"},
                    "parties": [None, None],
                },
            },
        )
    sys_msg = mock_complete.call_args.kwargs["messages"][0]["content"]
    assert "Currently selected document: mutual_nda" in sys_msg
    assert "purpose" in sys_msg
    assert "termKind" in sys_msg
    assert "Delaware" in sys_msg  # current form state included


def test_chat_502_on_llm_exception(auth_client):
    c, _ = auth_client
    with patch("prelegal.llm.completion", side_effect=RuntimeError("upstream")):
        r = c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
                "form": {"document_type": None, "field_values": {}, "parties": []},
            },
        )
    assert r.status_code == 502


def test_chat_502_on_invalid_json(auth_client):
    c, _ = auth_client
    with patch(
        "prelegal.llm.completion",
        return_value=_fake_completion("not json"),
    ):
        r = c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
                "form": {"document_type": None, "field_values": {}, "parties": []},
            },
        )
    assert r.status_code == 502


def test_chat_502_on_empty_choices(auth_client):
    c, _ = auth_client
    fake = MagicMock()
    fake.choices = []
    with patch("prelegal.llm.completion", return_value=fake):
        r = c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
                "form": {"document_type": None, "field_values": {}, "parties": []},
            },
        )
    assert r.status_code == 502
    assert "no choices" in r.json()["detail"]
