import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.models.email import Email
from app.models.link import Link
from app.schemas.email import EmailCreate, EmailCreateResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["emails"])


def _generate_short_code() -> str:
    return secrets.token_urlsafe(8)[:12]


@router.post("/emails", response_model=EmailCreateResponse)
def create_email(payload: EmailCreate, db: Session = Depends(get_db)) -> EmailCreateResponse:
    settings = get_settings()
    email = Email(
        recipient=str(payload.recipient),
        subject=payload.subject,
        status="sent",
    )
    db.add(email)
    db.flush()

    tracked_links: dict[str, str] = {}
    if payload.links:
        for link_url in payload.links:
            original_url = str(link_url)
            short_code = _generate_short_code()
            db.add(
                Link(
                    id=short_code,
                    email_id=email.id,
                    original_url=original_url,
                )
            )
            tracked_links[original_url] = f"{settings.base_url}/track/click/{short_code}"

    tracking_pixel = (
        f'<img src="{settings.base_url}/track/pixel/{email.id}" '
        f'width="1" height="1" style="display:none;" alt="" />'
    )

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to create email record")
        raise HTTPException(status_code=500, detail="Failed to create email record") from exc

    db.refresh(email)
    return EmailCreateResponse(
        email_id=email.id,
        tracking_pixel=tracking_pixel,
        tracked_links=tracked_links,
    )
