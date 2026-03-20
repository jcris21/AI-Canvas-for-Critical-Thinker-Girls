from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    app_env: str = "development"
    allowed_origins: list[str] = ["http://localhost:3000"]

    # Database (optional for MVP — not needed for AI-only endpoints)
    database_url: str = "sqlite+aiosqlite:///./dev.db"

    # AI
    gemini_api_key: str

    # Auth
    clerk_secret_key: str = ""
    clerk_publishable_key: str = ""

    # Storage
    gcs_bucket_name: str = ""
    google_application_credentials: str = ""

settings = Settings()
