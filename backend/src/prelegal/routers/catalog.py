from fastapi import APIRouter, HTTPException

from ..documents import DocumentSpec, get_spec, list_specs
from ..templates import read_template

router = APIRouter(prefix="/catalog")


@router.get("", response_model=list[DocumentSpec])
async def get_catalog() -> list[DocumentSpec]:
    return list_specs()


@router.get("/{doc_id}/template")
async def get_catalog_template(doc_id: str) -> dict[str, str]:
    spec = get_spec(doc_id)
    if not spec:
        raise HTTPException(status_code=404, detail=f"Unknown document: {doc_id}")
    return {"markdown": read_template(spec.filename)}
