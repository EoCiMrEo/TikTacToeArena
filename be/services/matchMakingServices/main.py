from flask import Flask
from config import Config
from extensions import db, migrate
from routes import matchmaking_bp
from matcher import Matcher
import logging
import os

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import models to ensure they are registered with SQLAlchemy
    from db.models.queue import MatchQueue

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

def check_schema(app):
    """
    Manually check and update schema for new columns if migration failed.
    """
    with app.app_context():
        # Raw SQL to add columns if they don't exist
        # Postgres supports IF NOT EXISTS for ADD COLUMN in newer versions, 
        # but 'ADD COLUMN IF NOT EXISTS' syntax is standard enough for PG 9.6+.
        # We are using postgres:15-alpine.
        try:
            with db.engine.connect() as conn:
                conn.execute(db.text("ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS game_speed VARCHAR(20) DEFAULT 'standard'"))
                conn.execute(db.text("ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS min_elo INTEGER DEFAULT 0"))
                conn.execute(db.text("ALTER TABLE match_queue ADD COLUMN IF NOT EXISTS max_elo INTEGER DEFAULT 3000"))
                conn.commit()
            print("Schema check completed (columns added if missing).")
        except Exception as e:
            print(f"Schema check warning: {e}")

if __name__ == '__main__':
    # Fix schema just in case
    check_schema(app)

    # Start matcher thread
    matcher.start()
    
    app.run(host='0.0.0.0', port=Config.PORT)

