from gevent import monkey
monkey.patch_all()

from flask import Flask
from flask_socketio import SocketIO
from flask_cors import CORS
import redis
import logging
import threading
import json
import os
from config import Config
from events import register_events

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("WebSocketGateway")

app = Flask(__name__)
app.config.from_object(Config)
CORS(app)

# Initialize SocketIO with Redis message queue for scaling (optional, but good for multi-node)
# However, we primarily need Redis to SUBSCRIBE to events from other services.
# The standard message_queue argument in SocketIO handles inter-socketio communication.
# To handle events NOT from another SocketIO node (e.g. from Flask REST API), we can use an external Redis listener.

# Using internal Redis manager for SocketIO scaling if needed later
socketio = SocketIO(app, cors_allowed_origins="*", async_mode='gevent', message_queue=Config.REDIS_URL)

register_events(socketio)

def redis_listener(redis_url, socketio_instance):
    """
    Listens to Redis Pub/Sub channels and broadcasts messages to SocketIO clients.
    """
    try:
        r = redis.from_url(redis_url)
        pubsub = r.pubsub()
        
        # Subscribe to relevant channels
        # 'game_updates': General updates for games
        # 'notifications': General user notifications
        pubsub.subscribe('game_updates', 'notifications', 'matchmaking_updates')
        
        logger.info(f"Connected to Redis at {redis_url} and subscribed to channels.")

        for message in pubsub.listen():
            if message['type'] == 'message':
                try:
                    channel = message['channel'].decode('utf-8')
                    data = json.loads(message['data'].decode('utf-8'))
                    
                    logger.info(f"Received Redis message on {channel}: {data}")

                    # Determine target room
                    # Expecting data format: {'event': 'event_name', 'data': {...}, 'room': 'target_room'}
                    event_name = data.get('event')
                    event_data = data.get('data')
                    room = data.get('room')

                    if event_name and event_data:
                        if room:
                            socketio_instance.emit(event_name, event_data, room=room)
                        else:
                            # Broadcast to all if no room specified (Use with caution)
                             socketio_instance.emit(event_name, event_data)
                except json.JSONDecodeError:
                    logger.error("Failed to decode JSON from Redis message")
                except Exception as e:
                    logger.error(f"Error processing Redis message: {e}")
    except Exception as e:
        logger.error(f"Redis listener failed: {e}")

# Start Redis listener in a background thread
redis_thread = threading.Thread(target=redis_listener, args=(Config.REDIS_URL, socketio))
redis_thread.daemon = True
redis_thread.start()

if __name__ == '__main__':
    port = Config.PORT
    logger.info(f"Starting WebSocket Gateway on port {port}")
    socketio.run(app, host='0.0.0.0', port=port)
