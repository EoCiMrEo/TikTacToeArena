from flask import Blueprint, request, jsonify, current_app
from extensions import db, supabase
from db.models.user_profile import UserProfile
from sqlalchemy import or_

profile_bp = Blueprint('profile', __name__)

def get_user_from_token():
    """Helper to verify token and get user ID from Supabase."""
    # Try getting from cookie first (common in this project)
    token = request.cookies.get('access_token_cookie')
    # Or Authorization header
    if not token and 'Authorization' in request.headers:
        auth_header = request.headers['Authorization']
        if auth_header.startswith('Bearer '):
            token = auth_header.split(' ')[1]

    if not token:
        return None
    
    try:
        res = supabase.auth.get_user(token)
        return res.user
    except Exception as e:
        current_app.logger.error(f"Token verification failed: {e}")
        return None

@profile_bp.route('/me', methods=['GET'])
def get_my_profile():
    user = get_user_from_token()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401

    profile = UserProfile.query.filter_by(id=user.id).first()
    
    if not profile:
        # Auto-create profile if checks fail but auth passes? 
        # Or return 404. Let's return 404 for now, or 200 with empty data?
        # Typically better to return 404 if not found.
        return jsonify({"message": "Profile not found"}), 404
        
    return jsonify(profile.to_dict()), 200

@profile_bp.route('/me', methods=['PUT'])
def update_my_profile():
    user = get_user_from_token()
    if not user:
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.get_json()
    profile = UserProfile.query.filter_by(id=user.id).first()
    
    if not profile:
        # Create if not exists (upsert logic for convenience)
        profile = UserProfile(id=user.id)
        db.session.add(profile)
    
    # Update fields
    allowed_fields = ['full_name', 'username']
    for field in allowed_fields:
        if field in data:
            setattr(profile, field, data[field])
            
    # Note: Stats/ELO should likely not be updateable here directly by user
    
    try:
        db.session.commit()
        return jsonify(profile.to_dict()), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 500

@profile_bp.route('/<uuid:user_id>', methods=['GET'])
def get_user_profile(user_id):
    profile = UserProfile.query.filter_by(id=user_id).first()
    if not profile:
        return jsonify({"message": "Profile not found"}), 404
    return jsonify(profile.to_dict()), 200

@profile_bp.route('/', methods=['GET'])
def list_profiles():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 10, type=int)
    
    pagination = UserProfile.query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'profiles': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200

@profile_bp.route('/search', methods=['GET'])
def search_profiles():
    query = request.args.get('q', '')
    if not query:
        return jsonify({"message": "Query parameter 'q' is required"}), 400
        
    # Search by username or full_name
    profiles = UserProfile.query.filter(
        or_(
            UserProfile.username.ilike(f'%{query}%'),
            UserProfile.full_name.ilike(f'%{query}%')
        )
    ).limit(20).all()
    
    return jsonify([p.to_dict() for p in profiles]), 200

@profile_bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    limit = request.args.get('limit', 50, type=int)
    offset = request.args.get('offset', 0, type=int)
    
    profiles = UserProfile.query.order_by(UserProfile.elo_rating.desc())\
        .offset(offset).limit(limit).all()
        
    return jsonify([p.to_dict() for p in profiles]), 200

# ============================================
# Internal Endpoints (Service-to-Service)
# ============================================

internal_bp = Blueprint('internal', __name__)

@internal_bp.route('/create', methods=['POST'])
def create_profile():
    """
    Internal endpoint for creating a user profile.
    Called by auth service after user registration.
    Expects: { "user_id": "<uuid>", "email": "<email>", "username": "<optional>" }
    """
    # Simple API key check for internal services (optional but recommended)
    api_key = request.headers.get('X-Internal-API-Key')
    expected_key = current_app.config.get('INTERNAL_API_KEY', 'dev_internal_key')
    
    if api_key != expected_key:
        current_app.logger.warning("Unauthorized internal API call attempt")
        return jsonify({"message": "Unauthorized"}), 401
    
    data = request.get_json()
    user_id = data.get('user_id')
    email = data.get('email') # Now required
    
    if not user_id:
        return jsonify({"message": "user_id is required"}), 400
    
    # Check if profile already exists
    existing = UserProfile.query.filter_by(id=user_id).first()
    if existing:
        return jsonify({"message": "Profile already exists", "profile": existing.to_dict()}), 200
    
    # Create new profile with default values
    profile = UserProfile(
        id=user_id,
        username=data.get('username'),
        email=email,
        full_name=data.get('full_name'),
        games_played=0,
        games_won=0,
        games_lost=0,
        games_drawn=0,
        win_streak=0,
        best_win_streak=0,
        elo_rating=1000,
        current_rank='Unranked'
    )
    
    try:
        db.session.add(profile)
        db.session.commit()
        current_app.logger.info(f"Profile created for user {user_id}")
        return jsonify({"message": "Profile created", "profile": profile.to_dict()}), 201
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"Failed to create profile: {e}")
        return jsonify({"message": str(e)}), 500

@internal_bp.route('/elo', methods=['PUT'])
def update_elo():
    """
    Internal endpoint for updating user ELO and stats.
    Called by Game Service after game completion.
    Expects: { "user_id": "<uuid>", "elo_change": int, "outcome": "win"|"loss"|"draw" }
    """
    api_key = request.headers.get('X-Internal-API-Key')
    expected_key = current_app.config.get('INTERNAL_API_KEY', 'dev_internal_key')
    
    if api_key != expected_key:
        return jsonify({"message": "Unauthorized"}), 401

    data = request.get_json()
    user_id = data.get('user_id')
    elo_change = data.get('elo_change')
    outcome = data.get('outcome')

    if not user_id or elo_change is None or outcome is None:
        return jsonify({"message": "Missing required fields"}), 400

    try:
        updated_profile = process_game_outcome(user_id, elo_change, outcome)
        return jsonify(updated_profile.to_dict()), 200
    except ValueError as e:
        return jsonify({"message": str(e)}), 404
    except Exception as e:
        return jsonify({"message": str(e)}), 500

def process_game_outcome(user_id, elo_change, outcome):
    import redis
    import json
    
    profile = UserProfile.query.filter_by(id=user_id).first()
    if not profile:
        raise ValueError("Profile not found")

    # Update stats
    profile.elo_rating += elo_change
    profile.games_played += 1
    
    if outcome == 'win':
        profile.games_won += 1
        profile.win_streak += 1
        if profile.win_streak > profile.best_win_streak:
            profile.best_win_streak = profile.win_streak
    elif outcome == 'loss':
        profile.games_lost += 1
        profile.win_streak = 0
    elif outcome == 'draw':
        profile.games_drawn += 1
        # Win streak might or might not reset on draw depending on rules. Let's keep it.
    
    try:
        db.session.commit()
        
        # Publish event to Redis (Event Bus)
        try:
            redis_url = current_app.config.get('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')
            r = redis.from_url(redis_url)
            event = {
                'user_id': user_id,
                'new_elo': profile.elo_rating,
                'username': profile.username,
                'avatar_url': profile.avatar_url if hasattr(profile, 'avatar_url') else None
            }
            r.publish('elo_updated', json.dumps(event))
            current_app.logger.info(f"Published elo_updated for {user_id}")
        except Exception as re:
            current_app.logger.error(f"Failed to publish Redis event: {re}")

        return profile
    except Exception as e:
        db.session.rollback()
        raise e
    finally:
         # Also notify Gateway directly so frontend knows to refresh stats (Avoiding race condition)
        try:
            redis_url = current_app.config.get('EVENT_BUS_REDIS_URL', 'redis://localhost:6382/0')
            r = redis.from_url(redis_url)
            gateway_message = {
                'event': 'profile_updated',
                'data': {
                    'user_id': user_id,
                    'new_elo': profile.elo_rating,
                    'games_played': profile.games_played,
                    'games_won': profile.games_won
                },
                'room': str(user_id)
            }
            r.publish('game_updates', json.dumps(gateway_message))
        except Exception as gw_e:
            current_app.logger.error(f"Failed to publish to Gateway: {gw_e}")
