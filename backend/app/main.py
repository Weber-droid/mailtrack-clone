from contextlib import asynccontextmanager
from collections.abc import AsyncIterator

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.routers.analytics import router as analytics_router
from app.routers.emails import router as emails_router
from app.routers.track import router as track_router


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    init_db()
    yield


settings = get_settings()

app = FastAPI(title="Mailtrack Clone", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[settings.frontend_url],
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)

app.include_router(emails_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(track_router)


@app.get("/health")
def health_check() -> dict[str, str]:
    return {"status": "ok"}
