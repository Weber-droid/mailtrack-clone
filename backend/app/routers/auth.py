import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status
from google.auth.transport import requests as google_requests
from google.oauth2 import id_token
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.database import get_db
from app.core.security import (
    CurrentUser,
    create_access_token,
    hash_password,
    verify_password,
)
from app.models.user import User
from app.schemas.auth import (
    AuthResponse,
    GoogleAuthRequest,
    LoginRequest,
    RegisterRequest,
    UserPublic,
    UserSettingsUpdate,
)
from app.services.webhooks import dispatch_webhook

logger = logging.getLogger(__name__)

router = APIRouter(tags=["auth"])


def _user_to_public(user: User) -> UserPublic:
    return UserPublic(
        id=user.id,
        email=user.email,
        name=user.name,
        plan=user.plan,
        onboarding_completed=user.onboarding_completed,
        track_opens_default=user.track_opens_default,
        track_links_default=user.track_links_default,
        append_disclosure=user.append_disclosure,
        disclosure_text=user.disclosure_text,
        tracking_domain=user.tracking_domain,
        webhook_url=user.webhook_url,
        retention_days=user.retention_days,
        is_admin=user.is_admin,
    )


def _auth_response(user: User) -> AuthResponse:
    return AuthResponse(access_token=create_access_token(user.id), user=_user_to_public(user))


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.scalar(select(User).where(User.email == str(payload.email)))
    if existing:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")

    settings = get_settings()
    is_admin = str(payload.email) in {
        e.strip() for e in settings.admin_emails.split(",") if e.strip()
    }

    user = User(
        email=str(payload.email),
        hashed_password=hash_password(payload.password),
        name=payload.name,
        is_admin=is_admin,
    )
    db.add(user)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("Registration failed")
        raise HTTPException(status_code=500, detail="Registration failed") from exc
    db.refresh(user)
    return _auth_response(user)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == str(payload.email)))
    if user is None or not user.hashed_password or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    return _auth_response(user)


@router.post("/google", response_model=AuthResponse)
def google_auth(payload: GoogleAuthRequest, db: Session = Depends(get_db)) -> AuthResponse:
    settings = get_settings()
    if not settings.google_client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    try:
        idinfo = id_token.verify_oauth2_token(
            payload.id_token, google_requests.Request(), settings.google_client_id
        )
    except ValueError as exc:
        raise HTTPException(status_code=401, detail="Invalid Google token") from exc

    google_sub = idinfo["sub"]
    email = idinfo.get("email")
    name = idinfo.get("name")
    if not email:
        raise HTTPException(status_code=400, detail="Google account has no email")

    user = db.scalar(select(User).where(User.google_sub == google_sub))
    if user is None:
        user = db.scalar(select(User).where(User.email == email))
        if user:
            user.google_sub = google_sub
            if name and not user.name:
                user.name = name
        else:
            is_admin = email in {e.strip() for e in settings.admin_emails.split(",") if e.strip()}
            user = User(email=email, google_sub=google_sub, name=name, is_admin=is_admin)
            db.add(user)

    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Google auth failed") from exc
    db.refresh(user)
    return _auth_response(user)


@router.get("/me", response_model=UserPublic)
def get_me(current_user: CurrentUser) -> UserPublic:
    return _user_to_public(current_user)


@router.patch("/me", response_model=UserPublic)
def update_me(
    payload: UserSettingsUpdate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> UserPublic:
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(current_user, field, value)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Update failed") from exc
    db.refresh(current_user)
    return _user_to_public(current_user)


@router.post("/webhooks/test")
def test_webhook(current_user: CurrentUser) -> dict[str, str]:
    if not current_user.webhook_url:
        raise HTTPException(status_code=400, detail="No webhook URL configured")
    dispatch_webhook(
        current_user,
        "test",
        {"message": "Webhook test from SendBeacon", "user_id": str(current_user.id)},
    )
    return {"status": "sent"}


@router.get("/account/export")
def export_account(current_user: CurrentUser, db: Session = Depends(get_db)) -> dict[str, Any]:
    from app.models.email import Email
    from app.models.tracking_event import TrackingEvent

    emails = db.scalars(select(Email).where(Email.user_id == current_user.id)).all()
    events = db.execute(
        select(TrackingEvent)
        .join(Email, TrackingEvent.email_id == Email.id)
        .where(Email.user_id == current_user.id)
    ).scalars().all()

    return {
        "user": _user_to_public(current_user).model_dump(),
        "emails": [
            {"id": str(e.id), "recipient": e.recipient, "subject": e.subject, "status": e.status}
            for e in emails
        ],
        "events": [
            {
                "event_type": ev.event_type,
                "email_id": str(ev.email_id),
                "timestamp": ev.timestamp.isoformat(),
            }
            for ev in events
        ],
    }


@router.delete("/account")
def delete_account(current_user: CurrentUser, db: Session = Depends(get_db)) -> dict[str, str]:
    db.delete(current_user)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Delete failed") from exc
    return {"status": "deleted"}
