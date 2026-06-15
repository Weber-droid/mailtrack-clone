import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import distinct, func, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.security import CurrentUser
from app.models.campaign import Campaign
from app.models.email import Email
from app.models.tracking_event import TrackingEvent
from app.routers.emails import _create_tracked_email
from app.schemas.campaign import CampaignCreate, CampaignResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["campaigns"])


@router.post("/campaigns", response_model=CampaignResponse)
def create_campaign(
    payload: CampaignCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> CampaignResponse:
    campaign = Campaign(
        user_id=current_user.id,
        name=payload.name,
        subject=payload.subject,
        subject_variant_b=payload.subject_variant_b,
        body_html=payload.body_html,
    )
    db.add(campaign)
    db.flush()

    links = [str(u) for u in payload.links] if payload.links else None
    for index, recipient in enumerate(payload.recipients):
        variant = None
        subject = payload.subject
        if payload.subject_variant_b and index % 2 == 1:
            variant = "B"
            subject = payload.subject_variant_b
        elif payload.subject_variant_b and index % 2 == 0:
            variant = "A"

        _create_tracked_email(
            db,
            current_user,
            str(recipient),
            subject,
            links,
            True,
            bool(links),
            campaign.id,
            variant,
            commit=False,
        )

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Campaign creation failed") from exc

    db.refresh(campaign)
    return _campaign_stats(db, campaign)


@router.get("/campaigns", response_model=list[CampaignResponse])
def list_campaigns(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[CampaignResponse]:
    campaigns = db.scalars(
        select(Campaign).where(Campaign.user_id == current_user.id).order_by(Campaign.created_at.desc())
    ).all()
    return [_campaign_stats(db, c) for c in campaigns]


@router.get("/campaigns/{campaign_id}", response_model=CampaignResponse)
def get_campaign(
    campaign_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> CampaignResponse:
    campaign = db.get(Campaign, campaign_id)
    if campaign is None or campaign.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Campaign not found")
    return _campaign_stats(db, campaign)


def _campaign_stats(db: Session, campaign: Campaign) -> CampaignResponse:
    total = db.scalar(select(func.count()).select_from(Email).where(Email.campaign_id == campaign.id)) or 0
    opened = (
        db.scalar(
            select(func.count(distinct(TrackingEvent.email_id)))
            .select_from(TrackingEvent)
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(Email.campaign_id == campaign.id, TrackingEvent.event_type == "open")
        )
        or 0
    )
    clicked = (
        db.scalar(
            select(func.count(distinct(TrackingEvent.email_id)))
            .select_from(TrackingEvent)
            .join(Email, TrackingEvent.email_id == Email.id)
            .where(Email.campaign_id == campaign.id, TrackingEvent.event_type == "click")
        )
        or 0
    )
    open_rate = round((opened / total) * 100, 1) if total else 0.0
    click_rate = round((clicked / total) * 100, 1) if total else 0.0
    return CampaignResponse(
        id=campaign.id,
        name=campaign.name,
        subject=campaign.subject,
        total_recipients=total,
        open_rate=open_rate,
        click_rate=click_rate,
    )
