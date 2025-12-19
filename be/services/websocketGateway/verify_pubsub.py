import redis
import json
import time
import os
from config import Config

# This script verifies that we can publish to the 'game_updates' channel 
# and receive it, simulating the Game Service -> Gateway flow.

REDIS_URL = Config.REDIS_URL # Should generally be ws_redis:6379 in container, but usually mapped locall
# We run this script INSIDE container or adjust URL.
# If running locally (Host), we should use localhost:6382 (mapped ws_redis).
# Config.REDIS_URL in main.py is Env dependent.
# Let's hardcode for local testing if running from host:
LOCAL_REDIS_URL = "redis://localhost:6382/0"

def verify_pubsub():
    print(f"Connecting to Redis at {LOCAL_REDIS_URL}...")
    try:
        r = redis.from_url(LOCAL_REDIS_URL)
        pubsub = r.pubsub()
        pubsub.subscribe('game_updates')
        print("Subscribed to 'game_updates'. Waiting for messages...")

        # Publisher (Simulating Game Service)
        publisher = redis.from_url(LOCAL_REDIS_URL)
        
        test_message = {
            'event': 'test_event',
            'data': {'msg': 'Hello from Verifier'},
            'room': 'test_room'
        }
        
        print("Publishing test message...")
        publisher.publish('game_updates', json.dumps(test_message))
        
        # Listen
        start = time.time()
        while time.time() - start < 5:
            message = pubsub.get_message()
            if message:
                if message['type'] == 'message':
                    data = json.loads(message['data'])
                    print(f"✅ Received message: {data}")
                    if data.get('event') == 'test_event':
                        print("SUCCESS: Pub/Sub is working.")
                        return
            time.sleep(0.1)
            
        print("❌ TIMEOUT: Did not receive message.")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    verify_pubsub()
