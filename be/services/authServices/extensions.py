import os
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from flask_migrate import Migrate
from supabase import create_client, Client
import logging
from pythonjsonlogger import jsonlogger

# Initialize Flask extensions
db = SQLAlchemy()
jwt = JWTManager()
bcrypt = Bcrypt()
cors = CORS()
migrate = Migrate()

# Initialize Supabase Client (Lazy loading usually better, but global is fine for now)
supabase: Client = None

def init_supabase(app):
    url = app.config.get('SUPABASE_URL')
    key = app.config.get('SUPABASE_KEY')
    if url and key:
        global supabase
        supabase = create_client(url, key)
    else:
        app.logger.warning("Supabase URL or Key not set. Auth will fail.")

from logging.handlers import RotatingFileHandler
import os

def setup_logging(app):
    # Ensure logs directory exists
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)

    # Common Formatter
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: %(message)s'
    )

    # 1. INFO Log File (Captures EVERYTHING INFO and up)
    info_handler = RotatingFileHandler(
        os.path.join(log_dir, 'app.log'), 
        maxBytes=10*1024*1024, # 10MB
        backupCount=5
    )
    info_handler.setLevel(logging.INFO)
    info_handler.setFormatter(formatter)

    # 2. ERROR Log File (Captures ONLY ERROR and CRITICAL)
    error_handler = RotatingFileHandler(
        os.path.join(log_dir, 'error.log'),
        maxBytes=10*1024*1024,
        backupCount=5
    )
    error_handler.setLevel(logging.ERROR)
    error_handler.setFormatter(formatter)

    # 3. Keep Stdout (for Docker/Dev)
    stream_handler = logging.StreamHandler()
    stream_handler.setLevel(logging.INFO)
    store_formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    stream_handler.setFormatter(store_formatter)

    # Add Handlers
    app.logger.addHandler(info_handler)
    app.logger.addHandler(error_handler)
    app.logger.addHandler(stream_handler)
    
    app.logger.setLevel(logging.INFO)
    app.logger.info("Logging setup complete. Logs writing to %s", log_dir)
