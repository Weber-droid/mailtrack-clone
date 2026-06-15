import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.campaign import Campaign
    from app.models.link import Link
    from app.models.tracking_event import TrackingEvent
    from app.models.user import User


class Email(Base):
    __tablename__ = "emails"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), index=True, nullable=False
    )
    campaign_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("campaigns.id", ondelete="SET NULL"), index=True, nullable=True
    )
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recipient: Mapped[str] = mapped_column(String(320), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="sent")
    variant: Mapped[str | None] = mapped_column(String(1), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    user: Mapped["User"] = relationship("User", back_populates="emails")
    campaign: Mapped["Campaign | None"] = relationship("Campaign", back_populates="emails")
    tracking_events: Mapped[list["TrackingEvent"]] = relationship(
        "TrackingEvent", back_populates="email", cascade="all, delete-orphan"
    )
    links: Mapped[list["Link"]] = relationship(
        "Link", back_populates="email", cascade="all, delete-orphan"
    )
