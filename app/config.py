"""
App config loaded from environment and .env via Pydantic Settings.
"""
from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

DEFAULT_OPENAI_MODEL = "gpt-4o-mini"


class Settings(BaseSettings):
    # Settings from environment (and .env).

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    openai_api_key: str | None = None
    openai_model: str = DEFAULT_OPENAI_MODEL
    default_openapi_url: str | None = None
    allowed_openapi_origins: list[str] = []

    @field_validator("allowed_openapi_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str | list[str] | None) -> list[str]:
        if v is None:
            return []
        if isinstance(v, list):
            return [x.strip() for x in v if isinstance(x, str) and x.strip()]
        s = str(v).strip()
        if not s:
            return []
        return [x.strip() for x in s.split(",") if x.strip()]


settings = Settings()
