import threading
import time
import logging
import json
import redis
import requests
from config import Config
from state.redis_store import get_redis, _key, KEY_STATE, GAME_TTL_SECONDS
from extensions import db
from db.models.game import Game
from datetime import datetime
import uuid

logger = logging.getLogger("TimeoutManager")

class TimeoutManager:
    def __init__(self, app):
        self.app = app
        self.running = False
        self.redis_client = get_redis()
        self.event_bus = redis.from_url(Config.EVENT_BUS_REDIS_URL)

    def start(self):
        self.running = True
        thread = threading.Thread(target=self._monitor_loop)
        thread.daemon = True
        thread.start()
        logger.info("TimeoutManager thread started.")

    def _monitor_loop(self):
        while self.running:
            with self.app.app_context():
                try:
                    self._check_timeouts()
                except Exception as e:
                    logger.error(f"Error in timeout monitor loop: {e}")
            
            time.sleep(2) # Check every 2 seconds

    def _check_timeouts(self):
        # Scan for active games
        # Using SCAN based on KEY_STATE pattern "game:*:state"
        # Note: keys() is blocking, scan_iter is better but for high volume
        # For this prototype, we likely don't have millions of keys.
        
        # We need to find all game keys.
        # Pattern: game:*:state
        
        cursor = '0'
        while cursor != 0:
            cursor, keys = self.redis_client.scan(cursor=cursor, match="game:*:state", count=100)
            for key in keys:
                self._process_game(key)

    def _process_game(self, key):
        state_raw = self.redis_client.get(key)
        if not state_raw:
            return

        try:
            state = json.loads(state_raw)
        except json.JSONDecodeError:
            return

        if state.get('status') != 'active':
            return

        # 1. Check Connection Status (Abandon)
        # We need to know who is online.
        # This information is in the WebSocket Gateway's Redis Set 'online_users'
        # BUT this manager is in Game Service. We need access to the same Redis instance or logic.
        # Assuming WS and Game use same Redis or can access the one with 'online_users'.
        # Config currently has REDIS_URL and EVENT_BUS_REDIS_URL.
        # online_users is likely in EVENT_BUS_REDIS_URL based on Gateway config?
        # Let's check Gateway config: REDIS_URL = redis://localhost:6382/0 (Event Bus usually)
        # Game Service EVENT_BUS_REDIS_URL = redis://localhost:6382/0
        
        # The key in Gateway is 'online_users'.
        
        # Check if both players are present in 'online_users' set
        # Since we are using redis-py, sismember returns boolean
        # using event_bus client which connects to 6382 where Gateway stores online_users (presumably)
        # Wait, Gateway config uses REDIS_URL for both pubsub and storage? 
        # Gateway main.py: redis_listener uses Config.REDIS_URL.
        # Gateway events.py uses redis.from_url(Config.REDIS_URL).
        
        # So yes, we should check self.event_bus for 'online_users'.
        
        p1 = state.get('player1_id')
        p2 = state.get('player2_id')
        
        if p1 and p2:
            p1_online = self.event_bus.sismember('online_users', p1)
            p2_online = self.event_bus.sismember('online_users', p2)
            
            if not p1_online and not p2_online:
                logger.info(f"Game {key} abandoned (both players offline).")
                self._end_game(state, key, reason='abandoned')
                return

        # 2. Check Timeouts
        last_move_time = state.get('updated_at', state.get('started_at'))
        if not last_move_time:
            return

        current_time = int(time.time())
        time_diff = current_time - last_move_time
        
        # Limit 35s (30s move + 5s grace/latency)
        if time_diff > 35:
            current_player = state.get('current_player_id')
            logger.info(f"Game {key} timed out. Current player {current_player} took too long.")
            
            self._end_game(state, key, reason='timeout')

    def _end_game(self, state, key, reason):
        game_id = key.split(':')[1]
        
        if reason == 'abandoned':
             state['status'] = 'abandoned'
             state['winner_id'] = None
             state['winning_line'] = []
        
        elif reason == 'timeout':
            state['status'] = 'completed'
            current_player = state['current_player_id']
            # Winner is the OTHER player
            winner_id = state['player1_id'] if current_player == state['player2_id'] else state['player2_id']
            state['winner_id'] = winner_id
            state['winning_line'] = [] # Time out has no line
        
        # Persist to Redis
        self.redis_client.setex(key, GAME_TTL_SECONDS, json.dumps(state))
        
        # Update DB
        game = Game.query.get(game_id)
        if game:
            game.status = state['status']
            game.finished_at = datetime.utcnow()
            game.final_board_state = state['board']
            if state.get('winner_id'):
                game.winner_id = uuid.UUID(state['winner_id'])
            db.session.commit()
            
        # Notify via Pub/Sub
        self._publish_update(game_id, 'game_over', state)

    def _publish_update(self, game_id, event_type, data):
        message = {
            'event': event_type,
            'data': data,
            'room': f"game_{game_id}"
        }
        self.event_bus.publish('game_updates', json.dumps(message))
