import os
from pydantic import BaseModel
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseModel):
    """Application settings."""
    APP_NAME: str = "All PDF Tools API"
    APP_VERSION: str = "1.0.0"
    API_PREFIX: str = "/api/v1"

    # Environment
    PYTHON_ENV: str = os.getenv("PYTHON_ENV", "development")

    # Temporary file storage
    TEMP_FILE_DIR: str = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_files")

    # Maximum file size (100MB in bytes)
    MAX_FILE_SIZE: int = 100 * 1024 * 1024

    # CORS settings
    CORS_ORIGINS: list = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

    # Gemini API settings
    # Note: We don't store the API key here as it will be provided by the user
    # and passed via headers

settings = Settings()

# Ensure temp directory exists
os.makedirs(settings.TEMP_FILE_DIR, exist_ok=True)
