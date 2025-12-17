import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
    
    # Database URI - ensure we use psycopg (psycopg3) driver
    _db_url = os.getenv('DATABASE_URL', 'postgresql://user:pass@localhost:5432/db')
    # Replace postgresql:// with postgresql+psycopg:// for psycopg3
    if _db_url.startswith('postgresql://'):
        _db_url = _db_url.replace('postgresql://', 'postgresql+psycopg://', 1)
    SQLALCHEMY_DATABASE_URI = _db_url
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    SUPABASE_URL = os.getenv('SUPABASE_URL')
    SUPABASE_KEY = os.getenv('SUPABASE_KEY')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6383/0')
    EVENT_BUS_REDIS_URL = os.getenv('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')

class DevelopmentConfig(Config):
    DEBUG = True

class ProductionConfig(Config):
    DEBUG = False

config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
