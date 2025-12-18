import sys
import os

# Add service directory to path to import config/models
sys.path.append(os.getcwd())

from flask import Flask
from services.matchMakingServices.config import Config
from services.matchMakingServices.extensions import db
from services.matchMakingServices.db.models.queue import MatchQueue
from sqlalchemy import inspect

app = Flask(__name__)
app.config.from_object(Config)
db.init_app(app)

with app.app_context():
    inspector = inspect(db.engine)
    columns = [c['name'] for c in inspector.get_columns('match_queue')]
    print(f"Columns in match_queue: {columns}")
    
    expected = ['game_speed', 'min_elo', 'max_elo']
    missing = [c for c in expected if c not in columns]
    
    if missing:
        print(f"MISSING COLUMNS: {missing}")
        # Try to forcefully add them if missing? 
        # Or just let the user know.
        sys.exit(1)
    else:
        print("Schema validation PASSED.")
        sys.exit(0)
