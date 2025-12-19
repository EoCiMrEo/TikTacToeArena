import redis
import os
import sys

def verify_redis():
    redis_url = os.getenv('EVENT_BUS_REDIS_URL', 'redis://host.docker.internal:6382/0')
    print(f"Connecting to Redis at {redis_url}...")
    try:
        r = redis.from_url(redis_url)
        r.ping()
        print("Successfully connected to Redis!")
        
        print("Publishing test event...")
        r.publish('domain_events', '{"event_type": "TEST", "payload": "test"}')
        print("Published successfully.")
        
    except Exception as e:
        print(f"Failed to connect to Redis: {e}")
        sys.exit(1)

if __name__ == '__main__':
    verify_redis()
