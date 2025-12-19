import socketio
import time
import redis
import json
import socketio
import time
import redis
import json
import threading
import jwt
import datetime
from config import Config

# URL of the WebSocket Gateway (Host -> Container)
WS_URL = 'http://localhost:5005'
# Redis URL (Host -> Container)
REDIS_URL = 'redis://localhost:6382/0'

def generate_valid_token():
    payload = {
        'sub': 'test-user-id',
        'iat': datetime.datetime.utcnow(),
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }
    return jwt.encode(payload, Config.JWT_SECRET_KEY, algorithm='HS256')

sio = socketio.Client()
game_id = "test-game-123"
received_update = False

@sio.event
def connect():
    print("✅ Connected to WebSocket")
    # Join game room
    sio.emit('join_game', {'game_id': game_id})

@sio.event
def joined_game(data):
    print(f"✅ Joined game room: {data}")

@sio.event
def game_update(data):
    global received_update
    print(f"✅ Received game_update: {data}")
    received_update = True

@sio.event
def disconnect():
    print("Disconnected")

def publish_update():
    time.sleep(2)
    print("📢 Publishing message to Redis 'game_updates'...")
    try:
        r = redis.from_url(REDIS_URL)
        message = {
            'event': 'game_update',
            'data': {'board': ['X', None], 'status': 'active'},
            'room': f"game_{game_id}"
        }
        r.publish('game_updates', json.dumps(message))
        print("📢 Message published.")
    except Exception as e:
        print(f"❌ Failed to publish: {e}")

def verify():
    token = generate_valid_token()
    url = f"{WS_URL}?token={token}"
    
    # Start publisher thread
    t = threading.Thread(target=publish_update)
    t.start()

    try:
        sio.connect(url, transports=['websocket'])
        
        # Wait for update
        start = time.time()
        while time.time() - start < 10:
            if received_update:
                print("🏆 SUCCESS: SocketIO received Redis broadcast!")
                break
            time.sleep(0.5)
            
        if not received_update:
            print("❌ FAILURE: Did not receive game_update within timeout.")
            
        sio.disconnect()
        
    except Exception as e:
        print(f"❌ Connection error: {e}")

if __name__ == '__main__':
    verify()
