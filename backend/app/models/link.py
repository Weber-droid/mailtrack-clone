import uuid
from typing import TYPE_CHECKING

from sqlalchemy import ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

if TYPE_CHECKING:
    from app.models.email import Email
    from app.models.tracking_event import TrackingEvent


class Link(Base):
    __tablename__ = "links"

    id: Mapped[str] = mapped_column(String(12), primary_key=True)
    email_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("emails.id", ondelete="CASCADE"), index=True, nullable=False
    )
    original_url: Mapped[str] = mapped_column(String(2048), nullable=False)

    email: Mapped["Email"] = relationship("Email", back_populates="links")
    tracking_events: Mapped[list["TrackingEvent"]] = relationship(
        "TrackingEvent", back_populates="link"
    )
