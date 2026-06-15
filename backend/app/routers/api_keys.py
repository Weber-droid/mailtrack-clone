import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser, hash_api_key
from app.models.api_key import ApiKey
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["api-keys"])


class ApiKeyCreate(BaseModel):
    name: str


class ApiKeyResponse(BaseModel):
    id: str
    name: str
    prefix: str
    key: str | None = None
    created_at: str


@router.post("/api-keys", response_model=ApiKeyResponse)
def create_api_key(
    payload: ApiKeyCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> ApiKeyResponse:
    raw_key = f"mk_live_{secrets.token_urlsafe(32)}"
    api_key = ApiKey(
        user_id=current_user.id,
        name=payload.name,
        prefix=raw_key[:16],
        key_hash=hash_api_key(raw_key),
    )
    db.add(api_key)
    db.commit()
    db.refresh(api_key)
    return ApiKeyResponse(
        id=str(api_key.id),
        name=api_key.name,
        prefix=api_key.prefix,
        key=raw_key,
        created_at=api_key.created_at.isoformat(),
    )


@router.get("/api-keys", response_model=list[ApiKeyResponse])
def list_api_keys(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[ApiKeyResponse]:
    keys = db.scalars(select(ApiKey).where(ApiKey.user_id == current_user.id)).all()
    return [
        ApiKeyResponse(
            id=str(k.id), name=k.name, prefix=k.prefix, created_at=k.created_at.isoformat()
        )
        for k in keys
    ]


@router.delete("/api-keys/{key_id}")
def delete_api_key(key_id: str, current_user: CurrentUser, db: Session = Depends(get_db)) -> dict[str, str]:
    from uuid import UUID

    api_key = db.get(ApiKey, UUID(key_id))
    if api_key is None or api_key.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="API key not found")
    db.delete(api_key)
    db.commit()
    return {"status": "deleted"}


@router.post("/send")
def esp_send(
    payload: dict,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> dict:
    from app.routers.emails import _create_tracked_email
    from app.schemas.email import EmailCreate

    data = EmailCreate(**payload)
    links = [str(u) for u in data.links] if data.links else None
    result = _create_tracked_email(
        db,
        current_user,
        str(data.recipient),
        data.subject,
        links,
        data.track_opens,
        data.track_links,
    )
    return result.model_dump()
