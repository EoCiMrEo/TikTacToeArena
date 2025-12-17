import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.environ.get('PORT', 5004))
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6384/0')
    # Redis where User Profile/Game publishes events (Port 6382 on host)
    EVENT_BUS_REDIS_URL = os.environ.get('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')
