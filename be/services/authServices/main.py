import os
from flask import Flask, jsonify
from config import config
from extensions import db, jwt, bcrypt, cors, migrate, setup_logging, init_supabase

def create_app(config_name='default'):
    app = Flask(__name__)
    
    # Load config
    app.config.from_object(config[config_name])
    
    # Setup Logging (JSON format as advised)
    setup_logging(app)
    
    # Initialize extensions
    init_supabase(app)
    db.init_app(app)
    jwt.init_app(app) # Still needed if we want to decode JWTs independently, or we can just verify via Supabase
    bcrypt.init_app(app)
    cors.init_app(app, resources={r"/auth/*": {"origins": app.config['FRONTEND_URL']}}, supports_credentials=True)
    migrate.init_app(app, db)
    
    # Register blueprints 
    from routes import auth_bp
    app.register_blueprint(auth_bp, url_prefix='/auth')
    
    @app.route('/health')
    def health():
        return jsonify({"status": "healthy", "service": "auth-service"}), 200
        
    return app

app = create_app(os.getenv('FLASK_ENV', 'default'))

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
