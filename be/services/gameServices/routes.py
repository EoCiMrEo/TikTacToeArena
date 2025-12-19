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

def publish_user_update(user_id, event_type, data):
    """
    Publish event to specific user's room via Redis Pub/Sub.
    Target room: user_id (as handled in WebSocket Gateway)
    """
    try:
        r = get_event_bus_client()
        message = {
            'event': event_type,
            'data': data,
            'room': str(user_id)  # Publish to user's personal room
        }
        # Publish to 'game_updates' channel which Gateway listens to
        r.publish('game_updates', json.dumps(message))
    except Exception as e:
        current_app.logger.error(f"Failed to publish user update: {e}")

@game_bp.route('/games', methods=['POST'])
def create_new_game():
    data = request.json
    player1_id = data.get('player1_id')
    player2_id = data.get('player2_id') # Optional, if matchmaking or invite
    settings = data.get('settings', {}) # Extract settings
    
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
    redis_state = create_game(game_id, player1_id, player2_id, settings)
    
    # 3. Notify
    if player2_id:
        publish_game_update(game_id, 'game_start', redis_state)
        
        # Notify both users to update their dashboard (active games list changed)
        publish_user_update(player1_id, 'dashboard_update', {'type': 'game_started', 'game_id': game_id})
        publish_user_update(player2_id, 'dashboard_update', {'type': 'game_started', 'game_id': game_id})

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
            
            # Update User Stats (ELO, Wins, Losses)
            player1_outcome = 'draw'
            player2_outcome = 'draw'
            player1_elo_change = 0
            player2_elo_change = 0
            
            if winner_id:
                if str(game.player1_id) == winner_id:
                    player1_outcome = 'win'
                    player2_outcome = 'loss'
                    player1_elo_change = 15
                    player2_elo_change = -10
                else:
                    player1_outcome = 'loss'
                    player2_outcome = 'win'
                    player1_elo_change = -10
                    player2_elo_change = 15
            
            # Publish Domain Event for Stats Sync
            try:
                r = get_event_bus_client()
                domain_event = {
                    'event_type': 'GAME_COMPLETED',
                    'payload': {
                        'game_id': game_id,
                        'finished_at': game.finished_at.isoformat(),
                        'player1_id': str(game.player1_id),
                        'player1_outcome': player1_outcome,
                        'player1_elo_change': player1_elo_change,
                        'player2_id': str(game.player2_id) if game.player2_id else None,
                        'player2_outcome': player2_outcome,
                        'player2_elo_change': player2_elo_change
                    }
                }
                r.publish('domain_events', json.dumps(domain_event))
                current_app.logger.info(f"Published GAME_COMPLETED event for {game_id}")
            except Exception as e:
                current_app.logger.error(f"Failed to publish domain event: {e}")

            # Notify both users to update their dashboard
            publish_user_update(str(game.player1_id), 'dashboard_update', {'type': 'game_ended', 'game_id': game_id})
            if game.player2_id:
                publish_user_update(str(game.player2_id), 'dashboard_update', {'type': 'game_ended', 'game_id': game_id})

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
        offset = request.args.get('offset', 0, type=int)
        
        games = Game.query.filter(
            ((Game.player1_id == uid) | (Game.player2_id == uid)),
            Game.status == 'completed'
        ).order_by(Game.finished_at.desc()).offset(offset).limit(limit).all()
        return jsonify([g.to_dict() for g in games]), 200
    except ValueError:
        return jsonify({'error': 'Invalid user_id'}), 400
