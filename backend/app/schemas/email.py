from uuid import UUID

from pydantic import BaseModel, EmailStr, Field, HttpUrl


class EmailCreate(BaseModel):
    recipient: EmailStr
    subject: str | None = None
    links: list[HttpUrl] | None = None


class EmailCreateResponse(BaseModel):
    email_id: UUID
    tracking_pixel: str
    tracked_links: dict[str, str] = Field(default_factory=dict)
