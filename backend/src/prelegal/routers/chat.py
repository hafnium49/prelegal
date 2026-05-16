from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..auth import User
from ..deps import require_user
from ..llm import ChatMessage, ChatResponse, FormState, run_turn

router = APIRouter()


class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    form: FormState


@router.post("/chat", response_model=ChatResponse)
async def chat(
    req: ChatRequest,
    _user: Annotated[User, Depends(require_user)],
) -> ChatResponse:
    try:
        return run_turn(req.messages, req.form)
    except Exception as exc:
        raise HTTPException(
            status_code=502, detail=f"Chat backend failed: {exc}"
        ) from exc
