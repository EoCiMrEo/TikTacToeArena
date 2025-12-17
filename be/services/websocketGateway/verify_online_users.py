import socketio
import jwt
import time
import sys

# Configuration
URL = 'http://localhost:5005'
SECRET_KEY = 'dev_secret_key' # Matches config.py default

def create_token(user_id):
    return jwt.encode({'sub': user_id}, SECRET_KEY, algorithm='HS256')

sio = socketio.Client()
sio2 = socketio.Client()

@sio.event
def connect():
    print(f"✅ User 1 connected")

@sio.event
def online_users_update(data):
    print(f"✅ User 1 received online update: {data}")

@sio2.event
def connect():
    print(f"✅ User 2 connected")

@sio2.event
def online_users_update(data):
    print(f"✅ User 2 received online update: {data}")

def test_online_users():
    try:
        token1 = create_token("user-1")
        token2 = create_token("user-2")

        print("Connecting User 1...")
        sio.connect(f"{URL}?token={token1}", wait_timeout=10)
        time.sleep(1)

        print("Connecting User 2...")
        sio2.connect(f"{URL}?token={token2}", wait_timeout=10)
        time.sleep(2)

        print("Disconnecting User 2...")
        sio2.disconnect()
        time.sleep(2)

        print("Disconnecting User 1...")
        sio.disconnect()
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        sys.exit(1)

if __name__ == '__main__':
    test_online_users()
