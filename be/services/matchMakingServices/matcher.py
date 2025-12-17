import time
import threading
import logging
import requests
import redis
import json
from config import Config
from extensions import db
from db.models.queue import MatchQueue

logger = logging.getLogger("Matcher")

class Matcher:
    def __init__(self, app):
        self.app = app
        self.running = False
        self.redis_client = redis.from_url(Config.REDIS_URL)
        self.event_bus = redis.from_url(Config.EVENT_BUS_REDIS_URL)

    def start(self):
        self.running = True
        thread = threading.Thread(target=self._match_loop)
        thread.daemon = True
        thread.start()
        logger.info("Matcher thread started.")

    def _match_loop(self):
        while self.running:
            with self.app.app_context():
                try:
                    self._process_queue()
                except Exception as e:
                    logger.error(f"Error in match loop: {e}")
            
            time.sleep(2) # Run every 2 seconds

    def _process_queue(self):
        # Simple bucket matching: sort by ELO
        queue_items = MatchQueue.query.order_by(MatchQueue.elo).all()
        
        if len(queue_items) < 2:
            return # Not enough players

        # Iterate and find pairs
        i = 0
        while i < len(queue_items) - 1:
            player1 = queue_items[i]
            player2 = queue_items[i+1]
            
            # Simple logic: precise pairing or range check
            # For now, just pair adjacent players if difference < 100
            elo_diff = abs(player1.elo - player2.elo)
            
            if elo_diff <= 200: # Allow 200 elo difference
                self._create_match(player1, player2)
                i += 2 # Skip these two
            else:
                i += 1 # Skip player1, try player2 with next

    def _create_match(self, p1, p2):
        logger.info(f"Match found: {p1.user_id} ({p1.elo}) vs {p2.user_id} ({p2.elo})")
        
        # 1. Call Game Service to create game
        try:
            # Game Service expects player1_id and player2_id
            payload = {
                "player1_id": p1.user_id,
                "player2_id": p2.user_id
            }
            # Use the public endpoint /games as per standard REST, or add internal if auth needed differently
            response = requests.post(f"{Config.GAME_SERVICE_URL}/games", json=payload, timeout=5)
            
            if response.status_code == 201:
                game_data = response.json()
                game_id = game_data.get('id') # Game model usually returns 'id'
                
                if not game_id:
                     logger.error(f"Game created but no ID returned: {game_data}")
                     return

                # 2. Notify Players via Redis
                # Player 1 is X (player1_id), Player 2 is O (player2_id)
                self._notify_match_found(p1.user_id, game_id, "X", p2.user_id)
                self._notify_match_found(p2.user_id, game_id, "O", p1.user_id)
                
                # 3. Remove from Queue
                db.session.delete(p1)
                db.session.delete(p2)
                db.session.commit()
                logger.info(f"Game {game_id} created and players removed from queue.")
            else:
                logger.error(f"Failed to create game: {response.text}")
        
        except Exception as e:
            logger.error(f"Error creating match: {e}")

    def _notify_match_found(self, user_id, game_id, symbol, opponent_id):
        message = {
            "event": "match_found",
            "data": {
                "game_id": game_id,
                "symbol": symbol,
                "opponent_id": opponent_id
            },
            "room": user_id # Target specific user room in socket gateway
        }
        self.event_bus.publish('matchmaking_updates', json.dumps(message))
