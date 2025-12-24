import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'qZikJy06ETFgk7siAfgK_Z9PwjTRdSGKBI4i2e8yZ-U')
    
    # SQLite configuration - Vercel-friendly
    if os.environ.get('VERCEL'):
        # Use /tmp for Vercel (writable)
        SQLALCHEMY_DATABASE_URI = 'sqlite:////tmp/emergency.db'
    else:
        # Local development
        SQLALCHEMY_DATABASE_URI = 'sqlite:///emergency.db'
    
    SQLALCHEMY_TRACK_MODIFICATIONS = False