import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    SECRET_KEY = os.getenv('SECRET_KEY', 'dev_game_secret')
    SQLALCHEMY_DATABASE_URI = os.getenv('DATABASE_URL', 'postgresql://game_user:game_pass@localhost:5434/game_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6380/0')
    EVENT_BUS_REDIS_URL = os.getenv('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')
    WS_GATEWAY_URL = os.getenv('WS_GATEWAY_URL', 'http://localhost:5005')
    PORT = int(os.getenv('PORT', 5002))
