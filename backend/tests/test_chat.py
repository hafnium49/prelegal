from unittest.mock import MagicMock, patch


def _fake_completion(content: str):
    fake = MagicMock()
    fake.choices = [MagicMock()]
    fake.choices[0].message.content = content
    return fake


def test_chat_returns_reply_and_updates(client):
    c, _ = client
    payload = '{"reply": "Got it!", "form_updates": {"purpose": "evaluate partnership"}}'
    with patch("prelegal.llm.completion", return_value=_fake_completion(payload)):
        r = c.post(
            "/api/chat",
            json={
                "messages": [
                    {"role": "user", "content": "We want to evaluate a partnership."}
                ],
                "form": {},
            },
        )
    assert r.status_code == 200
    data = r.json()
    assert data["reply"] == "Got it!"
    assert data["form_updates"]["purpose"] == "evaluate partnership"
    assert data["form_updates"]["termKind"] is None


def test_chat_passes_form_state_to_llm(client):
    c, _ = client
    payload = '{"reply": "ok", "form_updates": {}}'
    with patch(
        "prelegal.llm.completion", return_value=_fake_completion(payload)
    ) as mock_complete:
        c.post(
            "/api/chat",
            json={
                "messages": [{"role": "user", "content": "hi"}],
                "form": {"purpose": "already set"},
            },
        )
    sent_messages = mock_complete.call_args.kwargs["messages"]
    assert sent_messages[0]["role"] == "system"
    assert "MNDA" in sent_messages[0]["content"]
    assert "already set" in sent_messages[0]["content"]
    assert sent_messages[1] == {"role": "user", "content": "hi"}


def test_chat_502_on_empty_choices(client):
    c, _ = client
    fake = MagicMock()
    fake.choices = []
    with patch("prelegal.llm.completion", return_value=fake):
        r = c.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}], "form": {}},
        )
    assert r.status_code == 502
    assert "no choices" in r.json()["detail"]


def test_chat_502_on_llm_exception(client):
    c, _ = client
    with patch("prelegal.llm.completion", side_effect=RuntimeError("upstream down")):
        r = c.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}], "form": {}},
        )
    assert r.status_code == 502
    assert "Chat backend failed" in r.json()["detail"]


def test_chat_502_on_invalid_json(client):
    c, _ = client
    with patch(
        "prelegal.llm.completion",
        return_value=_fake_completion("not json at all"),
    ):
        r = c.post(
            "/api/chat",
            json={"messages": [{"role": "user", "content": "hi"}], "form": {}},
        )
    assert r.status_code == 502


def test_chat_accepts_party_updates(client):
    c, _ = client
    payload = (
        '{"reply": "Got it.", "form_updates": {"party1": {"company": "Acme Inc."}}}'
    )
    with patch("prelegal.llm.completion", return_value=_fake_completion(payload)):
        r = c.post(
            "/api/chat",
            json={
                "messages": [
                    {"role": "user", "content": "Party 1 is Acme Inc."}
                ],
                "form": {},
            },
        )
    assert r.status_code == 200
    assert r.json()["form_updates"]["party1"] == {
        "company": "Acme Inc.",
        "printName": None,
        "title": None,
        "noticeAddress": None,
    }
