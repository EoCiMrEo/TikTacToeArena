import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.environ.get('PORT', 5003))
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL', 'postgresql://mm_user:mm_pass@localhost:5435/matchmaking_db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6381/0')
    GAME_SERVICE_URL = os.environ.get('GAME_SERVICE_URL', 'http://localhost:5002')
    WS_GATEWAY_URL = os.environ.get('WS_GATEWAY_URL', 'http://localhost:5005')
    EVENT_BUS_REDIS_URL = os.environ.get('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')
