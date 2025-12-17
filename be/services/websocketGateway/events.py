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
