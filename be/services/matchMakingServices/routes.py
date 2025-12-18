from flask import Blueprint, request, jsonify
from extensions import db
from db.models.queue import MatchQueue

matchmaking_bp = Blueprint('matchmaking', __name__)

@matchmaking_bp.route('/queue/join', methods=['POST'])
def join_queue():
    data = request.json
    user_id = data.get('user_id')
    elo = data.get('elo')
    game_speed = data.get('game_speed', 'standard')
    min_elo = data.get('min_elo', 0)
    max_elo = data.get('max_elo', 3000)

    if not user_id or elo is None:
        return jsonify({'error': 'Missing user_id or elo'}), 400

    # 0. Check if user is already in an active game
    try:
        from config import Config
        import requests
        # Call Game Service
        game_url = f"{Config.GAME_SERVICE_URL}/games/active/{user_id}"
        response = requests.get(game_url, timeout=2)
        if response.status_code == 200:
            active_games = response.json()
            if active_games and len(active_games) > 0:
                 return jsonify({'error': 'User already in an active game', 'code': 'ACTIVE_GAME'}), 400
    except Exception as e:
        # Log error but maybe allow queueing if game service is down? 
        # For strictness, we might want to fail, but for now let's log.
        # Strict mode:
        print(f"Failed to check active games: {e}")
        # return jsonify({'error': 'Failed to verify game status'}), 500
        pass

    # check if user already in queue
    existing = MatchQueue.query.filter_by(user_id=user_id).first()
    if existing:
         existing.elo = elo # Update elo if changed
         existing.game_speed = game_speed
         existing.min_elo = min_elo
         existing.max_elo = max_elo
         existing.joined_at = db.func.now() # Refresh timestamp
    else:
        new_entry = MatchQueue(
            user_id=user_id, 
            elo=elo,
            game_speed=game_speed,
            min_elo=min_elo,
            max_elo=max_elo
        )
        db.session.add(new_entry)
    
    try:
        db.session.commit()
        return jsonify({'message': 'Joined queue', 'status': 'queued'}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@matchmaking_bp.route('/queue/leave', methods=['POST'])
def leave_queue():
    data = request.json
    user_id = data.get('user_id')
    
    if not user_id:
         return jsonify({'error': 'Missing user_id'}), 400

    entry = MatchQueue.query.filter_by(user_id=user_id).first()
    if entry:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Left queue', 'status': 'removed'}), 200
    
    return jsonify({'message': 'User not in queue'}), 404

@matchmaking_bp.route('/queue/status', methods=['GET'])
def get_status():
    count = MatchQueue.query.count()
    return jsonify({'queue_size': count}), 200
