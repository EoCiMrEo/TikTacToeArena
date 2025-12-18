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
        # 1. Group by game_speed
        queue_items = MatchQueue.query.order_by(MatchQueue.elo).all()
        logger.info(f"Processing queue: {len(queue_items)} players.")
        
        if len(queue_items) < 2:
            return

        buckets = {}
        for item in queue_items:
            # Normalize speed to lowercase to avoid casing issues
            speed = (item.game_speed or 'standard').lower()
            if speed not in buckets:
                buckets[speed] = []
            buckets[speed].append(item)
            logger.info(f"Player {item.user_id} ({item.elo}) added to bucket '{speed}'. Range: {item.min_elo}-{item.max_elo}")

        # 2. Match within buckets
        for speed, items in buckets.items():
            if len(items) < 2:
                logger.info(f"Bucket '{speed}' has {len(items)} players. Not enough to match.")
                continue
            
            logger.info(f"Bucket '{speed}' has {len(items)} players. Attempting to match...")
            i = 0
            while i < len(items) - 1:
                player1 = items[i]
                player2 = items[i+1]
                
                # Check mutual ELO requirements
                p1_satisfies_p2 = player2.min_elo <= player1.elo <= player2.max_elo
                p2_satisfies_p1 = player1.min_elo <= player2.elo <= player1.max_elo
                
                elo_diff = abs(player1.elo - player2.elo)
                
                # Combined check
                if p1_satisfies_p2 and p2_satisfies_p1 and elo_diff <= 300: # Increased hard cap to 300 for easier testing
                    self._create_match(player1, player2)
                    i += 2
                else:
                    logger.info(f"Match rejected: {player1.user_id} ({player1.elo}) vs {player2.user_id} ({player2.elo})")
                    logger.info(f"  > P1 satisfies P2 ({player2.min_elo}-{player2.max_elo})? {p1_satisfies_p2}")
                    logger.info(f"  > P2 satisfies P1 ({player1.min_elo}-{player1.max_elo})? {p2_satisfies_p1}")
                    logger.info(f"  > Diff {elo_diff} <= 300? {elo_diff <= 300}")
                    # Try next pair
                    i += 1

    def _create_match(self, p1, p2):
        logger.info(f"Match found: {p1.user_id} ({p1.elo}) vs {p2.user_id} ({p2.elo})")
        
        # Determine settings from p1 (since they matched on speed, p1.game_speed == p2.game_speed)
        speed = p1.game_speed or 'standard'
        
        # Map speed to time_per_move string for UI (could be done in FE, but let's send normalized data)
        # speed: 'blitz' (30s), 'standard' (2m), 'extended' (5m)
        time_map = {
            'blitz': '30 seconds',
            'standard': '2 minutes',
            'extended': '5 minutes'
        }
        time_per_move = time_map.get(speed, '2 minutes')

        game_settings = {
            "speed": speed,
            "timePerMove": time_per_move,
            "eloStakes": 24 # Dynamic later?
        }

        # 1. Call Game Service to create game
        try:
            payload = {
                "player1_id": p1.user_id,
                "player2_id": p2.user_id,
                "settings": game_settings
            }
            
            response = requests.post(f"{Config.GAME_SERVICE_URL}/games", json=payload, timeout=5)
            
            if response.status_code == 201:
                game_data = response.json()
                game_id = game_data.get('id') 
                
                if not game_id:
                     logger.error(f"Game created but no ID returned: {game_data}")
                     return

                # 2. Notify Players via Redis
                # Player 1 is X, Player 2 is O
                # Pass game_settings so FE can display them
                self._notify_match_found(p1.user_id, game_id, "X", p2.user_id, game_settings)
                self._notify_match_found(p2.user_id, game_id, "O", p1.user_id, game_settings)
                
                # 3. Remove from Queue
                db.session.delete(p1)
                db.session.delete(p2)
                db.session.commit()
                logger.info(f"Game {game_id} created and players removed from queue.")
            else:
                logger.error(f"Failed to create game: {response.text}")
        
        except Exception as e:
            logger.error(f"Error creating match: {e}")

    def _notify_match_found(self, user_id, game_id, symbol, opponent_id, settings):
        message = {
            "event": "match_found",
            "data": {
                "game_id": game_id,
                "symbol": symbol,
                "opponent_id": opponent_id,
                "game_settings": settings
            },
            "room": user_id 
        }
        self.event_bus.publish('matchmaking_updates', json.dumps(message))
