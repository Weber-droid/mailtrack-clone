import logging
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.security import CurrentUser
from app.models.email import Email
from app.models.user import User
from app.models.link import Link
from app.models.tracking_event import TrackingEvent
from app.schemas.email import EmailCreate, EmailCreateResponse, EmailDetail, LinkClickStat
from app.services.tracking_urls import build_click_url, build_pixel_html

logger = logging.getLogger(__name__)

router = APIRouter(tags=["emails"])


def _generate_short_code() -> str:
    return secrets.token_urlsafe(8)[:12]


def _create_tracked_email(
    db: Session,
    user: User,
    recipient: str,
    subject: str | None,
    links: list[str] | None,
    track_opens: bool,
    track_links: bool,
    campaign_id: UUID | None = None,
    variant: str | None = None,
    commit: bool = True,
) -> EmailCreateResponse:
    email = Email(
        user_id=user.id,
        recipient=recipient,
        subject=subject,
        status="sent",
        campaign_id=campaign_id,
        variant=variant,
    )
    db.add(email)
    db.flush()

    tracked_links: dict[str, str] = {}
    if track_links and links:
        for link_url in links:
            short_code = _generate_short_code()
            db.add(Link(id=short_code, email_id=email.id, original_url=link_url))
            tracked_links[link_url] = build_click_url(short_code, user)

    tracking_pixel = build_pixel_html(email.id, user) if track_opens else ""

    user.emails_sent_this_month += 1
    db.add(user)

    if commit:
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


@router.post("/emails", response_model=EmailCreateResponse)
def create_email(
    payload: EmailCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> EmailCreateResponse:
    links = [str(u) for u in payload.links] if payload.links else None
    return _create_tracked_email(
        db,
        current_user,
        str(payload.recipient),
        payload.subject,
        links,
        payload.track_opens,
        payload.track_links,
        payload.campaign_id,
        payload.variant,
    )


@router.get("/emails/{email_id}", response_model=EmailDetail)
def get_email(email_id: UUID, current_user: CurrentUser, db: Session = Depends(get_db)) -> EmailDetail:
    email = db.get(Email, email_id)
    if email is None or email.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Email not found")
    return EmailDetail(
        id=email.id,
        recipient=email.recipient,
        subject=email.subject,
        status=email.status,
        variant=email.variant,
        created_at=email.created_at.isoformat(),
    )


@router.get("/emails")
def list_emails(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    ids: str | None = None,
) -> list[EmailDetail]:
    stmt = select(Email).where(Email.user_id == current_user.id)
    if ids:
        id_list = [UUID(i.strip()) for i in ids.split(",") if i.strip()]
        stmt = stmt.where(Email.id.in_(id_list))
    emails = db.scalars(stmt.order_by(Email.created_at.desc()).limit(100)).all()
    return [
        EmailDetail(
            id=e.id,
            recipient=e.recipient,
            subject=e.subject,
            status=e.status,
            variant=e.variant,
            created_at=e.created_at.isoformat(),
        )
        for e in emails
    ]


@router.get("/emails/{email_id}/links", response_model=list[LinkClickStat])
def get_email_link_stats(
    email_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> list[LinkClickStat]:
    email = db.get(Email, email_id)
    if email is None or email.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Email not found")

    links = db.scalars(select(Link).where(Link.email_id == email_id)).all()
    stats: list[LinkClickStat] = []
    for link in links:
        count = db.scalar(
            select(func.count())
            .select_from(TrackingEvent)
            .where(TrackingEvent.link_id == link.id, TrackingEvent.event_type == "click")
        ) or 0
        stats.append(LinkClickStat(link_id=link.id, original_url=link.original_url, click_count=count))
    return stats
