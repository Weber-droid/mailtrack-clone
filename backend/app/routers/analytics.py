import csv
import io
import logging
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import distinct, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser
from app.models.email import Email
from app.models.tracking_event import TrackingEvent
from app.schemas.analytics import AnalyticsResponse, EventFeedItem

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analytics"])


def _parse_browser(user_agent: str | None) -> str:
    if not user_agent:
        return "Unknown"
    ua = user_agent.lower()
    for name in ("chrome", "firefox", "safari", "edge", "opera"):
        if name in ua:
            return name.capitalize()
    return "Other"


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(
    current_user: CurrentUser,
    db: Session = Depends(get_db),
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    exclude_bots: bool = False,
) -> AnalyticsResponse:
    try:
        email_filter = [Email.user_id == current_user.id]
        if date_from:
            email_filter.append(Email.created_at >= date_from)
        if date_to:
            email_filter.append(Email.created_at <= date_to)

        total_emails = db.scalar(select(func.count()).select_from(Email).where(*email_filter)) or 0

        if total_emails == 0:
            return AnalyticsResponse(
                total_emails=0,
                open_rate=0.0,
                click_rate=0.0,
                adjusted_open_rate=0.0,
                events=[],
                top_browsers=[],
                top_countries=[],
            )

        event_base = (
            select(TrackingEvent)
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(Email.user_id == current_user.id)
        )
        if exclude_bots:
            event_base = event_base.where(TrackingEvent.is_probable_bot.is_(False))

        opened_emails = db.scalar(
            select(func.count(distinct(TrackingEvent.email_id)))
            .select_from(TrackingEvent)
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(Email.user_id == current_user.id, TrackingEvent.event_type == "open")
        ) or 0

        adjusted_opened = db.scalar(
            select(func.count(distinct(TrackingEvent.email_id)))
            .select_from(TrackingEvent)
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(
                Email.user_id == current_user.id,
                TrackingEvent.event_type == "open",
                TrackingEvent.is_probable_bot.is_(False),
            )
        ) or 0

        clicked_emails = db.scalar(
            select(func.count(distinct(TrackingEvent.email_id)))
            .select_from(TrackingEvent)
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(Email.user_id == current_user.id, TrackingEvent.event_type == "click")
        ) or 0

        open_rate = round((opened_emails / total_emails) * 100, 1)
        adjusted_open_rate = round((adjusted_opened / total_emails) * 100, 1)
        click_rate = round((clicked_emails / total_emails) * 100, 1)

        rows = db.execute(
            select(
                Email.recipient,
                TrackingEvent.event_type,
                TrackingEvent.timestamp,
                TrackingEvent.ip_address,
                TrackingEvent.user_agent,
                TrackingEvent.link_id,
                TrackingEvent.is_probable_bot,
            )
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(Email.user_id == current_user.id)
            .order_by(TrackingEvent.timestamp.desc())
            .limit(100)
        ).all()

        events = [
            EventFeedItem(
                recipient=row.recipient,
                event_type=row.event_type,
                timestamp=row.timestamp,
                ip_address=row.ip_address,
                user_agent=row.user_agent,
                link_id=row.link_id,
                is_probable_bot=row.is_probable_bot,
            )
            for row in rows
        ]

        browser_counts: dict[str, int] = {}
        for row in rows:
            browser = _parse_browser(row.user_agent)
            browser_counts[browser] = browser_counts.get(browser, 0) + 1

        top_browsers = [
            {"name": name, "count": count}
            for name, count in sorted(browser_counts.items(), key=lambda x: x[1], reverse=True)[:5]
        ]

        return AnalyticsResponse(
            total_emails=total_emails,
            open_rate=open_rate,
            click_rate=click_rate,
            adjusted_open_rate=adjusted_open_rate,
            events=events,
            top_browsers=top_browsers,
            top_countries=[{"name": "Unknown", "count": len(rows)}],
        )
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch analytics")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics") from exc


@router.get("/analytics/export")
def export_analytics(current_user: CurrentUser, db: Session = Depends(get_db)) -> StreamingResponse:
    rows = db.execute(
        select(
            Email.recipient,
            Email.subject,
            TrackingEvent.event_type,
            TrackingEvent.timestamp,
            TrackingEvent.ip_address,
            TrackingEvent.user_agent,
            TrackingEvent.link_id,
        )
        .join(Email, TrackingEvent.email_id == Email.id)
        .where(Email.user_id == current_user.id)
        .order_by(TrackingEvent.timestamp.desc())
    ).all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["recipient", "subject", "event_type", "timestamp", "ip", "user_agent", "link_id"])
    for row in rows:
        writer.writerow(
            [row.recipient, row.subject, row.event_type, row.timestamp, row.ip_address, row.user_agent, row.link_id]
        )

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=analytics.csv"},
    )


@router.get("/recipients/{recipient_email}/timeline")
def recipient_timeline(
    recipient_email: str,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> dict:
    emails = db.scalars(
        select(Email)
        .where(Email.user_id == current_user.id, Email.recipient == recipient_email)
        .order_by(Email.created_at.desc())
    ).all()

    timeline = []
    for email in emails:
        events = db.scalars(
            select(TrackingEvent).where(TrackingEvent.email_id == email.id).order_by(TrackingEvent.timestamp)
        ).all()
        timeline.append(
            {
                "email_id": str(email.id),
                "subject": email.subject,
                "status": email.status,
                "created_at": email.created_at.isoformat(),
                "events": [
                    {
                        "event_type": e.event_type,
                        "timestamp": e.timestamp.isoformat(),
                        "link_id": e.link_id,
                    }
                    for e in events
                ],
            }
        )

    return {"recipient": recipient_email, "timeline": timeline}
