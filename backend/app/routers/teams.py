import logging

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import CurrentUser
from app.models.email import Email
from app.models.team import Team, TeamMember
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter(tags=["teams"])


class TeamCreate(BaseModel):
    name: str


class TeamInvite(BaseModel):
    email: EmailStr
    role: str = "member"


@router.post("/teams")
def create_team(payload: TeamCreate, current_user: CurrentUser, db: Session = Depends(get_db)) -> dict:
    team = Team(name=payload.name, owner_id=current_user.id)
    db.add(team)
    db.flush()
    db.add(TeamMember(team_id=team.id, user_id=current_user.id, role="admin"))
    db.commit()
    return {"id": str(team.id), "name": team.name}


@router.get("/teams")
def list_teams(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[dict]:
    memberships = db.scalars(select(TeamMember).where(TeamMember.user_id == current_user.id)).all()
    result = []
    for m in memberships:
        team = db.get(Team, m.team_id)
        if team:
            result.append({"id": str(team.id), "name": team.name, "role": m.role})
    return result


@router.post("/teams/{team_id}/invite")
def invite_member(
    team_id: str,
    payload: TeamInvite,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    from uuid import UUID

    membership = db.scalar(
        select(TeamMember).where(
            TeamMember.team_id == UUID(team_id),
            TeamMember.user_id == current_user.id,
            TeamMember.role == "admin",
        )
    )
    if membership is None:
        raise HTTPException(status_code=403, detail="Not team admin")

    user = db.scalar(select(User).where(User.email == str(payload.email)))
    if user is None:
        raise HTTPException(status_code=404, detail="User must register first")

    existing = db.scalar(
        select(TeamMember).where(TeamMember.team_id == UUID(team_id), TeamMember.user_id == user.id)
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already in team")

    db.add(TeamMember(team_id=UUID(team_id), user_id=user.id, role=payload.role))
    db.commit()
    return {"status": "invited"}
