from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


ROOT_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    app_name: str = "Huong Viet AI API"
    app_env: str = "development"
    host: str = "0.0.0.0"
    port: int = 8000
    cors_origins: list[str] = ["*"]

    gemini_api_key: str = Field(default="", alias="GEMINI_API_KEY")
    api_key: str = Field(default="", alias="API_KEY")
    model_name: str = Field(default="gemini-2.5-flash", alias="MODEL_NAME")
    database_url: str = Field(default="", alias="DATABASE_URL")
    direct_url: str = Field(default="", alias="DIRECT_URL")
    resend_api_key: str = Field(default="", alias="RESEND_API_KEY")
    resend_from_email: str = Field(default="onboarding@resend.dev", alias="RESEND_FROM_EMAIL")
    app_url: str = Field(default="", alias="APP_URL")
    twilio_account_sid: str = Field(default="", alias="TWILIO_ACCOUNT_SID")
    twilio_auth_token: str = Field(default="", alias="TWILIO_AUTH_TOKEN")
    twilio_phone_number: str = Field(default="", alias="TWILIO_PHONE_NUMBER")
    google_client_id: str = Field(default="", alias="GOOGLE_CLIENT_ID")
    facebook_client_id: str = Field(default="", alias="FACEBOOK_CLIENT_ID")
    facebook_client_secret: str = Field(default="", alias="FACEBOOK_CLIENT_SECRET")
    livekit_api_key: str = Field(default="", alias="LIVEKIT_API_KEY")
    livekit_api_secret: str = Field(default="", alias="LIVEKIT_API_SECRET")
    livekit_url: str = Field(default="", alias="LIVEKIT_URL")
    momo_partner_code: str = Field(default="", alias="MOMO_PARTNER_CODE")
    momo_access_key: str = Field(default="", alias="MOMO_ACCESS_KEY")
    momo_secret_key: str = Field(default="", alias="MOMO_SECRET_KEY")
    zalopay_app_id: str = Field(default="", alias="ZALOPAY_APP_ID")
    zalopay_key1: str = Field(default="", alias="ZALOPAY_KEY1")
    zalopay_key2: str = Field(default="", alias="ZALOPAY_KEY2")

    model_config = SettingsConfigDict(
        env_file=str(ROOT_DIR / ".env"),
        env_file_encoding="utf-8",
        extra="ignore",
        populate_by_name=True,
    )


@lru_cache
def get_settings() -> Settings:
    settings = Settings()
    if not settings.gemini_api_key and settings.api_key:
        settings.gemini_api_key = settings.api_key
    return settings
