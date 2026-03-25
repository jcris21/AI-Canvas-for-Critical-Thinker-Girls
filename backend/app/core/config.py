from pydantic import model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # Database (optional for AI-only local dev)
    DATABASE_URL: str = ""

    # Clerk (optional for AI-only local dev)
    CLERK_SECRET_KEY: str = ""
    CLERK_JWKS_URL: str = ""  # https://your-clerk-domain/.well-known/jwks.json

    @model_validator(mode="after")
    def _require_critical_env_vars(self) -> "Settings":
        if self.APP_ENV == "development":
            return self
        missing = []
        if self.DATABASE_URL == "":
            missing.append("DATABASE_URL")
        if self.CLERK_SECRET_KEY == "":
            missing.append("CLERK_SECRET_KEY")
        if missing:
            raise ValueError(
                f"Required environment variable(s) are not set or are empty: {', '.join(missing)}"
            )
        return self

    # Gemini — use GEMINI_API_KEY for local dev; Vertex AI for production
    GEMINI_API_KEY: str | None = None

    # Google Cloud (required only when GEMINI_API_KEY is not set)
    GCS_BUCKET_NAME: str = ""
    VERTEX_PROJECT: str = ""
    VERTEX_LOCATION: str = "us-central1"
    GEMINI_MODEL: str = "gemini-2.5-flash"

    # App
    APP_ENV: str = "development"
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]


settings = Settings()
