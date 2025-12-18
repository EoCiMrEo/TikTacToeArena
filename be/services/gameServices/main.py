import os
from flask import Flask
from config import Config
from extensions import db
from routes import game_bp
import logging

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    db.init_app(app)

    # Register Blueprints
    app.register_blueprint(game_bp)

    # Setup Logging
    logging.basicConfig(level=logging.INFO)

    # CORS configuration with credentials support
    # Required because frontend uses withCredentials: true
    from flask_cors import CORS
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:4028')
    CORS(app, resources={r"/*": {"origins": frontend_url}}, supports_credentials=True)

    return app

app = create_app()

if __name__ == '__main__':
    with app.app_context():
        db.create_all() # Create tables if not exist (simple migration)
    app.run(host='0.0.0.0', port=Config.PORT)
