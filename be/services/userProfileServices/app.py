from flask import Flask
from config import config
from extensions import db, migrate, cors, setup_logging, init_supabase
from routes import profile_bp, internal_bp
import os

def create_app(config_name='default'):
    app = Flask(__name__)
    
    app.config.from_object(config[config_name])
    
    # Initialize Extensions
    db.init_app(app)
    migrate.init_app(app, db)
    
    # Import models to ensure they are registered with SQLAlchemy
    from db.models.user_profile import UserProfile
    
    with app.app_context():
        db.create_all()
    
    frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:4028')
    cors.init_app(app, resources={r"/*": {"origins": frontend_url}}, supports_credentials=True)
    
    setup_logging(app)
    setup_logging(app)
    init_supabase(app)
    
    # Initialize Event Listener
    from event_listener import RedisEventListener
    event_bus_url = app.config.get('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')
    listener = RedisEventListener(app, event_bus_url, ['domain_events'])
    listener.start()
    
    # Register Blueprints
    app.register_blueprint(profile_bp, url_prefix='/profile')
    app.register_blueprint(internal_bp, url_prefix='/internal')
    
    from admin_routes import admin_bp
    app.register_blueprint(admin_bp, url_prefix='/admin')
    
    @app.route('/health')
    def health_check():
        return {"status": "healthy"}, 200
        
    return app

app = create_app(os.getenv('FLASK_ENV', 'default'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
