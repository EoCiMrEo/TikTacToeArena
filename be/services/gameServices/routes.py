from flask import Blueprint, request, jsonify, current_app
from extensions import db
from db.models.game import Game
from state.redis_store import create_game, get_state, apply_move
import redis
import json
import uuid
from datetime import datetime

game_bp = Blueprint('games', __name__)

def get_redis_client():
    return redis.from_url(current_app.config['REDIS_URL'])

def get_event_bus_client():
    return redis.from_url(current_app.config['EVENT_BUS_REDIS_URL'])

def publish_game_update(game_id, event_type, data):
    """
    Publish event to Redis Pub/Sub for WebSocket Gateway (Event Bus).
    """
    try:
        r = get_event_bus_client()
        message = {
            'event': event_type,
            'data': data,
            'room': f"game_{game_id}"
        }
        r.publish('game_updates', json.dumps(message))
    except Exception as e:
        current_app.logger.error(f"Failed to publish game update: {e}")

@game_bp.route('/games', methods=['POST'])
def create_new_game():
    data = request.json
    player1_id = data.get('player1_id')
    player2_id = data.get('player2_id') # Optional, if matchmaking or invite
    
    if not player1_id:
        return jsonify({'error': 'player1_id required'}), 400

    # 1. Create DB Record
    new_game = Game(
        player1_id=uuid.UUID(player1_id),
        player2_id=uuid.UUID(player2_id) if player2_id else None,
        status='active' if player2_id else 'waiting',
        started_at=datetime.utcnow() if player2_id else None
    )
    db.session.add(new_game)
    db.session.commit()
    
    # 2. Initialize Redis State
    game_id = str(new_game.id)
    redis_state = create_game(game_id, player1_id, player2_id)
    
    # 3. Notify
    if player2_id:
        publish_game_update(game_id, 'game_start', redis_state)

    return jsonify(new_game.to_dict()), 201

@game_bp.route('/games/<game_id>', methods=['GET'])
def get_game_state(game_id):
    # Try Redis first
    state = get_state(game_id)
    if state:
        return jsonify(state)
    
    # Fallback to DB (historical or cache miss)
    game = Game.query.get(game_id)
    if not game:
        return jsonify({'error': 'Game not found'}), 404
    return jsonify(game.to_dict()) # DB only has metadata, not board if not finished

@game_bp.route('/games/<game_id>/move', methods=['POST'])
def make_move(game_id):
    data = request.json
    user_id = data.get('user_id')
    position = data.get('position')
    
    if user_id is None or position is None:
        return jsonify({'error': 'user_id and position required'}), 400

    # Apply move in Redis
    result = apply_move(game_id, user_id, position)
    
    if not result['success']:
        return jsonify({'error': result['error']}), 400
    
    new_state = result['state']
    
    # Publish update
    publish_game_update(game_id, 'game_update', new_state)
    
    # Handle Game Over
    if new_state.get('status') == 'completed':
        # Update DB
        game = Game.query.get(game_id)
        if game:
            game.status = 'completed'
            game.finished_at = datetime.utcnow()
            game.final_board_state = new_state.get('board')
            winner_id = new_state.get('winner_id')
            if winner_id:
                game.winner_id = uuid.UUID(winner_id)
            db.session.commit()
            
            publish_game_update(game_id, 'game_over', new_state)

    return jsonify(new_state)


@game_bp.route('/games/active/<user_id>', methods=['GET'])
def get_active_games(user_id):
    try:
        uid = uuid.UUID(user_id)
        games = Game.query.filter(
            ((Game.player1_id == uid) | (Game.player2_id == uid)),
            Game.status == 'active'
        ).order_by(Game.started_at.desc()).all()
        return jsonify([g.to_dict() for g in games]), 200
    except ValueError:
        return jsonify({'error': 'Invalid user_id'}), 400

@game_bp.route('/games/recent/<user_id>', methods=['GET'])
def get_recent_games(user_id):
    try:
        uid = uuid.UUID(user_id)
        limit = request.args.get('limit', 5, type=int)
        games = Game.query.filter(
            ((Game.player1_id == uid) | (Game.player2_id == uid)),
            Game.status == 'completed'
        ).order_by(Game.finished_at.desc()).limit(limit).all()
        return jsonify([g.to_dict() for g in games]), 200
    except ValueError:
        return jsonify({'error': 'Invalid user_id'}), 400
