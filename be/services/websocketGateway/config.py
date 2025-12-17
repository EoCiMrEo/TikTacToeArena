import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_secret_key')
    JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'jwt_secret_key')
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6382/0')
    PORT = int(os.getenv('PORT', 5005))
    
    # CORS
    FRONTEND_URL = os.getenv('FRONTEND_URL', 'http://localhost:4028')
