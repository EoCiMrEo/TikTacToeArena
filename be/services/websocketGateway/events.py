from flask import request, session
from flask_socketio import emit, join_room, leave_room, disconnect
import logging
import redis
from config import Config
from auth import validate_token

logger = logging.getLogger(__name__)

# Initialize Redis client for tracking online users
redis_client = redis.from_url(Config.REDIS_URL)

def broadcast_online_count(socketio):
    try:
        count = redis_client.scard('online_users')
        socketio.emit('online_users_update', {'count': count}, broadcast=True)
    except Exception as e:
        logger.error(f"Failed to broadcast online count: {e}")

def register_events(socketio):
    @socketio.on('connect')
    def on_connect():
        token = request.args.get('token')
        if not token:
            logger.warning("Connection attempt without token")
            disconnect()
            return

        payload = validate_token(token)
        if not payload:
            logger.warning("Connection attempt with invalid token")
            disconnect()
            return
            
        user_id = payload.get('sub') # Assuming 'sub' holds the user UUID
        if not user_id:
            logger.warning("Token payload missing 'sub' (user_id)")
            disconnect()
            return

        # Store user_id in session for disconnect handler
        session['user_id'] = user_id

        # Join a room specific to this user for targeted messages
        join_room(user_id)
        
        # Add to online users set
        try:
            redis_client.sadd('online_users', user_id)
            broadcast_online_count(socketio)
        except Exception as e:
            logger.error(f"Redis error on connect: {e}")

        logger.info(f"User connected: {user_id}")
        emit('connection_response', {'status': 'success', 'user_id': user_id})

    @socketio.on('disconnect')
    def on_disconnect():
        user_id = session.get('user_id')
        if user_id:
            try:
                redis_client.srem('online_users', user_id)
                broadcast_online_count(socketio)
            except Exception as e:
                logger.error(f"Redis error on disconnect: {e}")
            logger.info(f"User disconnected: {user_id}")
        else:
            logger.info("Client disconnected (unknown user)")

    @socketio.on('join_game')
    def on_join_game(data):
        """
        Client requests to join a specific game room to receive updates.
        """
        game_id = data.get('game_id')
        if game_id:
            join_room(f"game_{game_id}")
            logger.info(f"Client joined game room: game_{game_id}")
            emit('joined_game', {'game_id': game_id})

    @socketio.on('leave_game')
    def on_leave_game(data):
        game_id = data.get('game_id')
        if game_id:
            leave_room(f"game_{game_id}")
            logger.info(f"Client left game room: game_{game_id}")
            emit('left_game', {'game_id': game_id})

    @socketio.on('player_ready')
    def on_player_ready(data):
        """
        Handle player ready status.
        data: { 'game_id': str, 'ready': bool }
        """
        user_id = session.get('user_id')
        if not user_id:
            return

        game_id = data.get('game_id')
        ready_status = data.get('ready', False)

        if not game_id:
            return

        room_name = f"game_{game_id}"
        
        # 1. Broadcast ready status to room (so opponent sees it)
        # Note: 'include_self=False' if we want strictly opponent, but 'broadcast=True' in room hits everyone.
        # It's better to let everyone know so UI stays in sync.
        emit('player_ready_update', {
            'user_id': user_id,
            'ready': ready_status
        }, room=room_name)

        logger.info(f"Player {user_id} is ready: {ready_status} in game {game_id}")

        # 2. Track readiness in Redis to sync start
        redis_key = f"game:{game_id}:ready_players"
        
        if ready_status:
            redis_client.sadd(redis_key, user_id)
            # Set expiry for safety (e.g., 1 hour)
            redis_client.expire(redis_key, 3600)
        else:
            redis_client.srem(redis_key, user_id)

        # 3. Check if both players are ready
        ready_count = redis_client.scard(redis_key)
        
        # Assuming 2 players for TicTacToe
        if ready_count >= 2:
            logger.info(f"Both players ready for game {game_id}. Starting countdown.")
            emit('game_start_countdown', {
                'start_in': 5, # 3 seconds countdown
                'game_id': game_id
            }, room=room_name)
            
            # Optionally clear the ready key or keep it
            redis_client.delete(redis_key)
