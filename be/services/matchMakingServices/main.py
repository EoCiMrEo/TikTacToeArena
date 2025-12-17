from flask import Flask
from config import Config
from extensions import db
from routes import matchmaking_bp
from matcher import Matcher
import logging

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(matchmaking_bp)

    # Setup Logging
    logging.basicConfig(level=logging.INFO)

    from flask_cors import CORS
    CORS(app) # Enable CORS for all routes (or restrict to frontend URL)

    return app

app = create_app()

# Initialize and start Matcher
# We need to do this efficiently. In production, might want a separate worker process.
# For this setup, a background thread in the app process is fine.
matcher = Matcher(app)

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Create tables
        
    # Start matcher thread
    matcher.start()
    
    app.run(host='0.0.0.0', port=Config.PORT)
