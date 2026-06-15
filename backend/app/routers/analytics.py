import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import distinct, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.email import Email
from app.models.tracking_event import TrackingEvent
from app.schemas.analytics import AnalyticsResponse, EventFeedItem

logger = logging.getLogger(__name__)

router = APIRouter(tags=["analytics"])


@router.get("/analytics", response_model=AnalyticsResponse)
def get_analytics(db: Session = Depends(get_db)) -> AnalyticsResponse:
    try:
        total_emails = db.scalar(select(func.count()).select_from(Email)) or 0

        if total_emails == 0:
            return AnalyticsResponse(
                total_emails=0,
                open_rate=0.0,
                click_rate=0.0,
                events=[],
            )

        opened_emails = db.scalar(
            select(func.count(distinct(TrackingEvent.email_id))).where(
                TrackingEvent.event_type == "open"
            )
        ) or 0

        clicked_emails = db.scalar(
            select(func.count(distinct(TrackingEvent.email_id))).where(
                TrackingEvent.event_type == "click"
            )
        ) or 0

        open_rate = round((opened_emails / total_emails) * 100, 1)
        click_rate = round((clicked_emails / total_emails) * 100, 1)

        rows = db.execute(
            select(
                Email.recipient,
                TrackingEvent.event_type,
                TrackingEvent.timestamp,
                TrackingEvent.ip_address,
                TrackingEvent.user_agent,
            )
            .join(Email, TrackingEvent.email_id == Email.id)
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
            )
            for row in rows
        ]

        return AnalyticsResponse(
            total_emails=total_emails,
            open_rate=open_rate,
            click_rate=click_rate,
            events=events,
        )
    except SQLAlchemyError as exc:
        logger.exception("Failed to fetch analytics")
        raise HTTPException(status_code=500, detail="Failed to fetch analytics") from exc
