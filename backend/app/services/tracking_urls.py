from uuid import UUID

from app.core.config import get_settings
from app.models.user import User


def get_tracking_base_url(user: User | None = None) -> str:
    settings = get_settings()
    if user and user.tracking_domain:
        return user.tracking_domain.rstrip("/")
    if settings.tracking_domain:
        return settings.tracking_domain.rstrip("/")
    return settings.base_url.rstrip("/")


def build_pixel_url(email_id: UUID, user: User | None = None) -> str:
    return f"{get_tracking_base_url(user)}/track/pixel/{email_id}"


def build_click_url(short_code: str, user: User | None = None) -> str:
    return f"{get_tracking_base_url(user)}/track/click/{short_code}"


def build_pixel_html(email_id: UUID, user: User | None = None) -> str:
    url = build_pixel_url(email_id, user)
    return f'<img src="{url}" width="1" height="1" style="display:none;" alt="" />'
