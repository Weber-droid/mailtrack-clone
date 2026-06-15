from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.routers.admin import router as admin_router
from app.routers.analytics import router as analytics_router
from app.routers.api_keys import router as api_keys_router
from app.routers.auth import router as auth_router
from app.routers.campaigns import router as campaigns_router
from app.routers.emails import router as emails_router
from app.routers.templates import router as templates_router
from app.routers.teams import router as teams_router
from app.routers.track import router as track_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


settings = get_settings()

app = FastAPI(title="SendBeacon", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api/auth")
app.include_router(emails_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(campaigns_router, prefix="/api")
app.include_router(templates_router, prefix="/api")
app.include_router(api_keys_router, prefix="/api")
app.include_router(teams_router, prefix="/api")
app.include_router(admin_router, prefix="/api")
app.include_router(track_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
