import redis
import json
import threading
import logging
from flask import current_app
from db.models.user_profile import UserProfile
from extensions import db

logger = logging.getLogger(__name__)

class RedisEventListener(threading.Thread):
    def __init__(self, app, redis_url, channels):
        threading.Thread.__init__(self)
        self.app = app
        self.redis = redis.from_url(redis_url)
        self.pubsub = self.redis.pubsub()
        self.pubsub.subscribe(channels)
        self.daemon = True # Daemon thread ensuring it exits when main app exits

    def run(self):
        logger.info(f"Starting Redis Event Listener on channels: {self.pubsub.channels}")
        for message in self.pubsub.listen():
            if message['type'] == 'message':
                with self.app.app_context():
                    self.handle_message(message)

    def handle_message(self, message):
        try:
            data = json.loads(message['data'])
            event_type = data.get('event_type')
            
            logger.info(f"Received event: {event_type}")

            if event_type == 'GAME_COMPLETED':
                self.handle_game_completed(data['payload'])
        except Exception as e:
            logger.error(f"Error handling event: {e}")
            self.push_to_dlq(message, str(e))

    def push_to_dlq(self, message, error):
        """Push failed message to Dead Letter Queue"""
        try:
            dlq_entry = {
                'message': message,
                'error': error,
                'timestamp': __import__('datetime').datetime.utcnow().isoformat()
            }
            self.redis.rpush('dlq:game_events', json.dumps(dlq_entry))
            logger.warning(f"Event pushed to DLQ: {error}")
        except Exception as dlq_error:
            logger.critical(f"Failed to push to DLQ: {dlq_error}")


    def handle_game_completed(self, payload):
        from routes import process_game_outcome # delayed import to avoid circular dependency
        
        # Payload expected: 
        # { 'player1_id': ..., 'player1_outcome': ..., 'player1_elo_change': ..., 
        #   'player2_id': ..., 'player2_outcome': ..., 'player2_elo_change': ... }
        
        try:
            if 'player1_id' in payload:
                process_game_outcome(
                    payload['player1_id'], 
                    payload['player1_elo_change'], 
                    payload['player1_outcome']
                )
                
            if 'player2_id' in payload and payload['player2_id']:
                process_game_outcome(
                    payload['player2_id'], 
                    payload['player2_elo_change'], 
                    payload['player2_outcome']
                )
                
            logger.info("Successfully processed GAME_COMPLETED event")
        except Exception as e:
            logger.error(f"Failed to process game outcome: {e}")
