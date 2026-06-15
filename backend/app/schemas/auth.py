from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class UserPublic(BaseModel):
    id: UUID
    email: EmailStr
    name: str | None = None
    plan: str
    onboarding_completed: bool
    track_opens_default: bool
    track_links_default: bool
    append_disclosure: bool
    disclosure_text: str | None = None
    tracking_domain: str | None = None
    webhook_url: str | None = None
    retention_days: int | None = None
    is_admin: bool = False


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserPublic


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    name: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class GoogleAuthRequest(BaseModel):
    id_token: str


class UserSettingsUpdate(BaseModel):
    name: str | None = None
    tracking_domain: str | None = None
    webhook_url: str | None = None
    webhook_secret: str | None = None
    append_disclosure: bool | None = None
    disclosure_text: str | None = None
    track_opens_default: bool | None = None
    track_links_default: bool | None = None
    onboarding_completed: bool | None = None
    retention_days: int | None = None
