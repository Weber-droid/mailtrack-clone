import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import RedirectResponse, Response
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.email import Email
from app.models.link import Link
from app.models.tracking_event import TrackingEvent
from app.schemas.analytics import AnalyticsResponse, EventFeedItem

logger = logging.getLogger(__name__)

router = APIRouter(tags=["track"])

TRANSPARENT_GIF = (
    b"\x47\x49\x46\x38\x39\x61\x01\x00\x01\x00\x80\x00\x00\x00\x00\x00"
    b"\xff\xff\xff\x21\xf9\x04\x01\x00\x00\x00\x00\x2c\x00\x00\x00\x00"
    b"\x01\x00\x01\x00\x00\x02\x02\x4c\x01\x00\x3b"
)


def _extract_client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    if request.client:
        return request.client.host
    return None


def _extract_user_agent(request: Request) -> str | None:
    return request.headers.get("user-agent")


@router.get("/track/pixel/{email_id}")
def track_pixel(email_id: UUID, request: Request, db: Session = Depends(get_db)) -> Response:
    ip_address = _extract_client_ip(request)
    user_agent = _extract_user_agent(request)

    email = db.get(Email, email_id)
    if email is None:
        raise HTTPException(status_code=404, detail="Email not found")

    event = TrackingEvent(
        email_id=email_id,
        event_type="open",
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(event)

    if email.status == "sent":
        email.status = "opened"

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to record open event for email %s", email_id)
        raise HTTPException(status_code=500, detail="Failed to record open event") from exc

    return Response(
        content=TRANSPARENT_GIF,
        media_type="image/gif",
        headers={"Cache-Control": "no-store"},
    )


@router.get("/track/click/{short_code}")
def track_click(short_code: str, request: Request, db: Session = Depends(get_db)) -> RedirectResponse:
    ip_address = _extract_client_ip(request)
    user_agent = _extract_user_agent(request)

    link = db.get(Link, short_code)
    if link is None:
        raise HTTPException(status_code=404, detail="Tracking link not found")

    event = TrackingEvent(
        email_id=link.email_id,
        event_type="click",
        ip_address=ip_address,
        user_agent=user_agent,
    )
    db.add(event)

    email = db.get(Email, link.email_id)
    if email is not None:
        email.status = "clicked"

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Failed to record click event for link %s", short_code)
        raise HTTPException(status_code=500, detail="Failed to record click event") from exc

    return RedirectResponse(url=link.original_url, status_code=302)
