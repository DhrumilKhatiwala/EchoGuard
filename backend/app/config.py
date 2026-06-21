import os

from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    api_host: str = "0.0.0.0"
    api_port: int = 8000
    debug: bool = True
    cors_origins: str = "*"
    model_path: str = "../models/"
    model_name: str = "echoguard_v1"

    # Upload limits
    max_file_size_mb: int = 30
    max_duration_seconds: int = 300  # 5 minutes

    # Storage
    upload_dir: str = "./uploads"

    class Config:
        env_file = ".env"
        case_sensitive = False
        protected_namespaces = ("settings_",)


settings = Settings()
