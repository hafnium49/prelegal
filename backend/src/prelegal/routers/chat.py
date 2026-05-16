from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from ..llm import ChatMessage, ChatResponse, run_turn

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    form: dict


@router.post("/chat", response_model=ChatResponse)
async def chat(req: ChatRequest) -> ChatResponse:
    try:
        return run_turn(req.messages, req.form)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Chat backend failed: {exc}"
        ) from exc
