from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class EmailCreate(BaseModel):
    recipient: EmailStr
    subject: str | None = None
    links: list[HttpUrl] | None = None
    track_opens: bool = True
    track_links: bool = True
    campaign_id: UUID | None = None
    variant: str | None = None


class EmailCreateResponse(BaseModel):
    email_id: UUID
    tracking_pixel: str
    tracked_links: dict[str, str] = Field(default_factory=dict)


class EmailDetail(BaseModel):
    id: UUID
    recipient: str
    subject: str | None
    status: str
    variant: str | None
    created_at: str


class LinkClickStat(BaseModel):
    link_id: str
    original_url: str
    click_count: int
