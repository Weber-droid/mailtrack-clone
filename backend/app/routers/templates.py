import json
import logging

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session
from uuid import UUID

from app.core.database import get_db
from app.core.security import CurrentUser
from app.models.template import Template
from app.schemas.campaign import TemplateCreate, TemplateResponse

logger = logging.getLogger(__name__)

router = APIRouter(tags=["templates"])


@router.post("/templates", response_model=TemplateResponse)
def create_template(
    payload: TemplateCreate,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> TemplateResponse:
    template = Template(
        user_id=current_user.id,
        name=payload.name,
        subject=payload.subject,
        body_html=payload.body_html,
        default_links=json.dumps(payload.default_links) if payload.default_links else None,
    )
    db.add(template)
    try:
        db.commit()
    except SQLAlchemyError as exc:
        db.rollback()
        raise HTTPException(status_code=500, detail="Template creation failed") from exc
    db.refresh(template)
    return _to_response(template)


@router.get("/templates", response_model=list[TemplateResponse])
def list_templates(current_user: CurrentUser, db: Session = Depends(get_db)) -> list[TemplateResponse]:
    templates = db.scalars(
        select(Template).where(Template.user_id == current_user.id).order_by(Template.created_at.desc())
    ).all()
    return [_to_response(t) for t in templates]


@router.delete("/templates/{template_id}")
def delete_template(
    template_id: UUID,
    current_user: CurrentUser,
    db: Session = Depends(get_db),
) -> dict[str, str]:
    template = db.get(Template, template_id)
    if template is None or template.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Template not found")
    db.delete(template)
    db.commit()
    return {"status": "deleted"}


def _to_response(template: Template) -> TemplateResponse:
    links = json.loads(template.default_links) if template.default_links else None
    return TemplateResponse(
        id=template.id,
        name=template.name,
        subject=template.subject,
        body_html=template.body_html,
        default_links=links,
    )
