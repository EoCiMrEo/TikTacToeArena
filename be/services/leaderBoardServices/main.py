from flask import Flask
from flask_cors import CORS
from config import Config
from routes import leaderboard_bp
from listener import LeaderboardListener
import redis
import logging

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)
    CORS(app)

    # Register Blueprints
    app.register_blueprint(leaderboard_bp)

    # Setup Logging
    logging.basicConfig(level=logging.INFO)

    return app

app = create_app()

# Initialize Listener
# Connects to local separate storage redis
storage_redis = redis.from_url(Config.REDIS_URL)
listener = LeaderboardListener(storage_redis)

if __name__ == '__main__':
    # Start listener thread
    listener.start()
    
    port = Config.PORT
    app.run(host='0.0.0.0', port=port)
