import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'your-production-secret-key')
    
    # Handle PostgreSQL URL from Vercel
    DATABASE_URL = os.environ.get('POSTGRES_URL_NON_POOLING')
    
    if DATABASE_URL:
        if DATABASE_URL.startswith('postgres://'):
            DATABASE_URL = DATABASE_URL.replace('postgres://', 'postgresql://', 1)
        SQLALCHEMY_DATABASE_URI = DATABASE_URL
    else:
        # Fallback to SQLite for local development
        SQLALCHEMY_DATABASE_URI = 'sqlite:///emergency.db'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False