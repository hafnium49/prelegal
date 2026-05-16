import datetime
from typing import Literal

from litellm import completion
from pydantic import BaseModel, Field

from .documents import DOCUMENT_SPECS, DocumentSpec, get_spec

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class PartyValue(BaseModel):
    company: str | None = None
    printName: str | None = None
    title: str | None = None
    noticeAddress: str | None = None


class FormState(BaseModel):
    document_type: str | None = None
    field_values: dict[str, str | int | None] = Field(default_factory=dict)
    parties: list[PartyValue | None] = Field(default_factory=list)


class ChatResponse(BaseModel):
    reply: str
    form_updates: FormState = Field(default_factory=FormState)


BASE_PROMPT = """You help users prepare legal agreements from a catalog of Common Paper templates.

Available documents:
{catalog}

If the user asks for a document not in this catalog (e.g. "employment agreement"), do not refuse — explain that you can't generate exactly that, then recommend the closest available match from the catalog and ask if they'd like to proceed with it.

{doc_section}

Hold a short, friendly conversation. Ask focused questions one or two at a time — do not bombard the user with a long checklist.

On every user message, FIRST extract every value you can reasonably infer (even casual phrasing) and populate the corresponding keys in form_updates. THEN decide what to ask next (only ask about fields still missing in the current form state). Never ask the user to repeat info they have already given you.

Response shape — a single JSON object with two keys:
{{
  "reply": "<your plain-text message to the user>",
  "form_updates": {{
    "document_type": null or "<one of the catalog ids>",
    "field_values": {{}},
    "parties": []
  }}
}}

For form_updates:
- Set document_type ONLY when newly choosing or changing it. Otherwise leave it null.
- field_values: include only keys you have new info for, using the exact field key names listed above. Example: {{"purpose": "evaluating a partnership", "termYears": 3}}.
- parties: a JSON list matching the document's party count. Each entry is either a partial party object or null for "no update". Example for two parties where only party 1 got an update: [{{"company": "Acme Inc."}}, null]. If you have no party updates, send an empty list [].

Extraction examples (apply these patterns to ANY document type):
- User: "I want a Pilot Agreement to let Globex test our product Foobar for 90 days, free of charge" → document_type: "pilot_agreement", field_values: {{"productDescription": "Foobar", "pilotPeriod": "90 days", "fees": "Free of charge"}}, parties: [null, {{"company": "Globex"}}] (Globex is the Customer = parties[1])
- User: "Provider is Initech LLC, signed by Bill Lumbergh, CEO, notice address bill@initech.example. Customer is Globex Corp, signed by Jane Smith, COO, jane@globex.example" → parties: [{{"company": "Initech LLC", "printName": "Bill Lumbergh", "title": "CEO", "noticeAddress": "bill@initech.example"}}, {{"company": "Globex Corp", "printName": "Jane Smith", "title": "COO", "noticeAddress": "jane@globex.example"}}]
- User (when parties[1].company is already set to "Globex"): "Jane Smith, COO, jane@globex.example" → parties: [null, {{"printName": "Jane Smith", "title": "COO", "noticeAddress": "jane@globex.example"}}] (these belong to parties[1] because parties[0] is already fully set)
- User: "Today" (after being asked for effective date) → field_values: {{"effectiveDate": "<today's ISO date from the date line above>"}}
- User: "Delaware law, Wilmington jurisdiction" → field_values: {{"governingLaw": "Delaware", "jurisdiction": "Wilmington, Delaware"}}

Whenever the user names a company / signer / title / notice address, you MUST place it in the parties array at the correct index (matching the document's party_roles order). Never claim "got it" for party info without populating the parties array.

Style rules:
- Plain text only. No markdown, no asterisks for emphasis, no bullet lists.
- Keep replies short — 1 to 3 sentences.
- Every reply MUST end with a follow-on question if any required field is still missing. Never leave the user uncertain about what to do next.
- Before declaring completion, VERIFY against the "Current form state" block above that every required field and every party's company/printName/title/noticeAddress is actually populated. Do not say "all set" or "download" if any required value is still missing — instead ask about the missing piece.
- When every required field for the selected document IS set, your reply is a single short sentence telling the user to click the purple "Download / Print PDF" button at the top. No "shall I finalize" — there is no finalize step.
- Stay focused on the chosen document. If asked off-topic, gently steer back.
"""


def _build_system_prompt(spec: DocumentSpec | None) -> str:
    catalog = "\n".join(
        f"- {s.id}: {s.name}. {s.description}" for s in DOCUMENT_SPECS.values()
    )

    if spec is None:
        summary = "\n".join(
            f"  - {s.id}: fields = [{', '.join(f.key for f in s.fields)}];"
            f" parties = [{' + '.join(s.party_roles)}]"
            for s in DOCUMENT_SPECS.values()
        )
        doc_section = (
            "No document type selected yet. As soon as you can identify which "
            "document the user wants (either directly from the catalog or by "
            "suggesting the closest match for an unsupported request), set "
            "form_updates.document_type to its catalog id.\n\n"
            "Field & party keys per document (use these exact keys when "
            "extracting values, even on the same turn you set document_type):\n"
            + summary
        )
    else:
        field_lines = "\n".join(
            f"  - {f.key} ({'REQUIRED' if f.required else 'optional'}, {f.type})"
            + (f" — {f.hint}" if f.hint else "")
            + (f" — must be one of: {', '.join(f.choices)}" if f.choices else "")
            for f in spec.fields
        )
        party_lines = "\n".join(
            f"  - parties[{i}] = {role}: gather company, printName, title, noticeAddress"
            for i, role in enumerate(spec.party_roles)
        )
        doc_section = (
            f"Currently selected document: {spec.id} ({spec.name}).\n"
            f"Fields to gather for this document:\n{field_lines}\n"
            f"Parties to gather ({len(spec.party_roles)} total):\n{party_lines}"
        )

    return BASE_PROMPT.format(catalog=catalog, doc_section=doc_section)


def run_turn(messages: list[ChatMessage], form: FormState) -> ChatResponse:
    spec = get_spec(form.document_type) if form.document_type else None
    today = datetime.date.today().isoformat()
    system_content = (
        f"{_build_system_prompt(spec)}\n\n"
        f"Today's date is {today}.\n"
        f"Current form state:\n{form.model_dump_json(indent=2)}"
    )
    llm_messages: list[dict] = [{"role": "system", "content": system_content}]
    llm_messages.extend({"role": m.role, "content": m.content} for m in messages)

    response = completion(
        model=MODEL,
        messages=llm_messages,
        # "low" (per the Cerebras skill example) caused gpt-oss-120b to silently
        # drop party field updates while still claiming "all set"; "medium"
        # fixed it in live tests. Worth the slight latency.
        reasoning_effort="medium",
        extra_body=EXTRA_BODY,
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "ChatResponse",
                "schema": ChatResponse.model_json_schema(),
                "strict": False,
            },
        },
    )
    if not response.choices:
        raise RuntimeError("LLM returned no choices")
    raw = response.choices[0].message.content or "{}"
    return ChatResponse.model_validate_json(raw)
