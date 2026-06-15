from functools import lru_cache

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8")

    database_url: str = "sqlite:///./mailtrack.db"
    frontend_url: str = "http://localhost:3000"
    base_url: str = "http://localhost:8000"
    tracking_domain: str | None = None

    jwt_secret: str = "dev-secret-change-in-production"
    jwt_algorithm: str = "HS256"
    jwt_expire_days: int = 7

    google_client_id: str | None = None

    admin_emails: str = ""


@lru_cache
def get_settings() -> Settings:
    return Settings()
