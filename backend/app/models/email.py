import uuid
from datetime import datetime
from typing import TYPE_CHECKING

from sqlalchemy import DateTime, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.link import Link
    from app.models.tracking_event import TrackingEvent


class Email(Base):
    __tablename__ = "emails"

    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    subject: Mapped[str | None] = mapped_column(String(500), nullable=True)
    recipient: Mapped[str] = mapped_column(String(320), index=True, nullable=False)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="sent")
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )

    tracking_events: Mapped[list["TrackingEvent"]] = relationship(
        "TrackingEvent",
        back_populates="email",
        cascade="all, delete-orphan",
    )
    links: Mapped[list["Link"]] = relationship(
        "Link",
        back_populates="email",
        cascade="all, delete-orphan",
    )
