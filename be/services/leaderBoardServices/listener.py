import threading
import logging
import redis
import json
from config import Config

logger = logging.getLogger("LeaderboardListener")

class LeaderboardListener:
    def __init__(self, storage_redis):
        self.storage_redis = storage_redis
        self.running = False
        
    def start(self):
        self.running = True
        thread = threading.Thread(target=self._listen_loop)
        thread.daemon = True
        thread.start()
        logger.info("Leaderboard listener thread started.")

    def _listen_loop(self):
        try:
            # Connect to "Bus" Redis (User Profile's Redis)
            r = redis.from_url(Config.EVENT_BUS_REDIS_URL)
            pubsub = r.pubsub()
            pubsub.subscribe('elo_updated')
            
            logger.info(f"Subscribed to elo_updated on {Config.EVENT_BUS_REDIS_URL}")
            
            for message in pubsub.listen():
                if not self.running:
                    break
                    
                if message['type'] == 'message':
                    try:
                        data = json.loads(message['data'].decode('utf-8'))
                        self._process_update(data)
                    except Exception as e:
                        logger.error(f"Error processing message: {e}")
                        
        except Exception as e:
            logger.error(f"Listener connection failed: {e}")

    def _process_update(self, data):
        """
        Updates the ZSET in local storage redis.
        """
        user_id = data.get('user_id')
        new_elo = data.get('new_elo')
        username = data.get('username')
        
        if user_id and new_elo is not None:
            # ZADD leaderboard <elo> <user_id>
            # We want descending order logic. Redis ZSET is ascending by default.
            # But ZREVRANGE gives us what we want. So store raw ELO.
            self.storage_redis.zadd('leaderboard_global', {user_id: new_elo})
            
            # Store metadata
            if username:
               self.storage_redis.hset(f"user:{user_id}", "username", username)
               
            logger.info(f"Updated leaderboard for {username} ({user_id}): {new_elo}")
