import datetime
import json
from typing import Literal

from litellm import completion
from pydantic import BaseModel, Field

MODEL = "openrouter/openai/gpt-oss-120b"
EXTRA_BODY = {"provider": {"order": ["cerebras"]}}


class PartyInfoUpdate(BaseModel):
    company: str | None = None
    printName: str | None = None
    title: str | None = None
    noticeAddress: str | None = None


class MndaFormUpdate(BaseModel):
    purpose: str | None = None
    effectiveDate: str | None = None
    termKind: Literal["years", "until_terminated"] | None = None
    termYears: int | None = None
    confidentialityKind: Literal["years", "perpetual"] | None = None
    confidentialityYears: int | None = None
    governingLaw: str | None = None
    jurisdiction: str | None = None
    modifications: str | None = None
    party1: PartyInfoUpdate | None = None
    party2: PartyInfoUpdate | None = None


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str


class ChatResponse(BaseModel):
    reply: str
    form_updates: MndaFormUpdate = Field(default_factory=MndaFormUpdate)


SYSTEM_PROMPT = """You help users prepare a Common Paper Mutual Non-Disclosure Agreement (MNDA) between two parties.

Hold a short, friendly conversation to gather the information below. Ask focused questions one or two at a time — do not bombard the user with a long checklist. When the user gives you information, extract it into structured form updates.

Fields to gather:
- purpose: free text describing how confidential information will be used
- effectiveDate: ISO date (YYYY-MM-DD); if user says "today" use today's date
- termKind: "years" (with termYears: integer >= 1) or "until_terminated"
- confidentialityKind: "years" (with confidentialityYears: integer >= 1) or "perpetual"
- governingLaw: US state name only (e.g. "Delaware")
- jurisdiction: city/county and state (e.g. "New Castle, Delaware")
- modifications: optional free text; leave null if none
- party1 and party2 (both required), each with:
  - company (legal entity name)
  - printName (signer's full name)
  - title (signer's job title)
  - noticeAddress (email or postal address)

Response shape: a single JSON object with two keys, "reply" (string) and "form_updates" (object). Set form_updates keys you have new information for; leave others null. For party1/party2, only include the sub-fields you have new info for (e.g. {"party1": {"company": "Acme"}}). Do not restate fields already set in the current form unless the user is changing them.

Style rules for the "reply" text:
- Plain text only. No markdown, no asterisks for emphasis, no bullet lists.
- Keep replies short — 1 to 3 sentences.
- When the user asks what a field means, explain briefly, then ask for their value.
- Stay focused on the MNDA. If asked off-topic, gently steer back.

There is no "finalize" or "confirm" step in this app. The MNDA document on the right of the screen updates live as fields are set. When every field appears to be set, your reply should be a single short sentence telling the user to click the purple "Download / Print PDF" button at the top — do not ask the user to confirm, do not list back the values they entered."""


def run_turn(messages: list[ChatMessage], form: dict) -> ChatResponse:
    today = datetime.date.today().isoformat()
    system_content = (
        f"{SYSTEM_PROMPT}\n\n"
        f"Today's date is {today}.\n"
        f"Current form state:\n{json.dumps(form, indent=2, default=str)}"
    )
    llm_messages: list[dict] = [{"role": "system", "content": system_content}]
    llm_messages.extend({"role": m.role, "content": m.content} for m in messages)

    response = completion(
        model=MODEL,
        messages=llm_messages,
        reasoning_effort="low",
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
