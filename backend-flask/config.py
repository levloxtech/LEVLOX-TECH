import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

class Config:
    """Base Configuration class."""
    SECRET_KEY = os.getenv("SECRET_KEY", "dev-session-secret-key")
    
    # Flask Environment
    ENV = os.getenv("FLASK_ENV", "development")
    DEBUG = ENV == "development"
    PORT = int(os.getenv("PORT", 5000))
    
    # MongoDB Config
    MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/levlox_crm")
    
    # JWT Config
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "dev-jwt-secret-key-1234567890")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(days=int(os.getenv("JWT_ACCESS_TOKEN_EXPIRES_DAYS", 30)))
    
    # CORS Config
    default_origins = (
        "http://localhost:5173,"
        "http://localhost:5174,"
        "https://levlox-tech-crm.vercel.app,"
        "https://levloxshowcase.com,"
        "https://www.levloxshowcase.com"
    )
    CORS_ORIGINS = [
        origin.strip() 
        for origin in os.getenv("ALLOWED_ORIGINS", default_origins).split(",") 
        if origin.strip()
    ]
