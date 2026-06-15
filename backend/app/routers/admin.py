from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser
from app.models.email import Email
from app.models.tracking_event import TrackingEvent
from app.models.user import User

router = APIRouter(tags=["admin"])


def _require_admin(current_user: CurrentUser) -> None:
    if not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin access required")


@router.get("/admin/stats")
def admin_stats(current_user: CurrentUser, db: Session = Depends(get_db)) -> dict:
    _require_admin(current_user)
    return {
        "total_users": db.scalar(select(func.count()).select_from(User)) or 0,
        "total_emails": db.scalar(select(func.count()).select_from(Email)) or 0,
        "total_events": db.scalar(select(func.count()).select_from(TrackingEvent)) or 0,
    }


@router.get("/admin/users")
def admin_users(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[dict]:
    _require_admin(current_user)
    users = db.scalars(select(User).order_by(User.created_at.desc()).limit(100)).all()
    return [
        {
            "id": str(u.id),
            "email": u.email,
            "plan": u.plan,
            "emails_sent": u.emails_sent_this_month,
            "created_at": u.created_at.isoformat(),
        }
        for u in users
    ]
