from datetime import datetime

from pydantic import BaseModel, ConfigDict


class EventFeedItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    recipient: str
    event_type: str
    timestamp: datetime
    ip_address: str | None = None
    user_agent: str | None = None


class AnalyticsResponse(BaseModel):
    total_emails: int
    open_rate: float
    click_rate: float
    events: list[EventFeedItem]
