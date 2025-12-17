from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from supabase import create_client, Client
import logging
from pythonjsonlogger import jsonlogger
import os

db = SQLAlchemy()
migrate = Migrate()
cors = CORS()

supabase: Client = None

def init_supabase(app):
    url = app.config.get('SUPABASE_URL')
    key = app.config.get('SUPABASE_KEY')
    if url and key:
        global supabase
        supabase = create_client(url, key)
    else:
        app.logger.warning("Supabase URL or Key not set. Auth verification will fail.")

def setup_logging(app):
    log_dir = os.path.join(os.path.dirname(__file__), 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    handler = logging.StreamHandler()
    handler.setLevel(logging.INFO)
    formatter = jsonlogger.JsonFormatter('%(asctime)s %(levelname)s %(name)s %(message)s')
    handler.setFormatter(formatter)
    
    app.logger.addHandler(handler)
    app.logger.setLevel(logging.INFO)
