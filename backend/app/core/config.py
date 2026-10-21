from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    postgres_user: str
    postgres_password: str
    postgres_db: str
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 30
    aws_access_key_id: str
    aws_secret_access_key: str
    aws_region: str = "us-east-1"
    s3_bucket_name: str
    openai_api_key: str
    openai_chat_model: str = "gpt-4o-mini"
    public_organization_id: int = 1
    frontend_origin: str = "http://localhost:3000"
    daily_chat_limit_per_visitor: int = Field(default=10, ge=1)
    daily_chat_limit_global: int = Field(default=100, ge=1)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
    )


settings = Settings()
