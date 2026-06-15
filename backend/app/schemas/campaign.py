from uuid import UUID

from pydantic import BaseModel, EmailStr, HttpUrl


class CampaignCreate(BaseModel):
    name: str
    subject: str | None = None
    subject_variant_b: str | None = None
    body_html: str | None = None
    recipients: list[EmailStr]
    links: list[HttpUrl] | None = None


class CampaignResponse(BaseModel):
    id: UUID
    name: str
    subject: str | None
    total_recipients: int
    open_rate: float
    click_rate: float


class TemplateCreate(BaseModel):
    name: str
    subject: str | None = None
    body_html: str | None = None
    default_links: list[str] | None = None


class TemplateResponse(BaseModel):
    id: UUID
    name: str
    subject: str | None
    body_html: str | None
    default_links: list[str] | None = None
