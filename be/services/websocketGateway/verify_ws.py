import socketio
import jwt
import time
import os

# Configuration
URL = 'http://localhost:5005'
SECRET_KEY = 'dev_secret_key_change_in_production'

# Create a dummy token
user_id = "test-user-123"
token = jwt.encode({'sub': user_id}, SECRET_KEY, algorithm='HS256')

sio = socketio.Client()

@sio.event
def connect():
    print(f"✅ Connected to WebSocket Gateway at {URL}")

@sio.event
def connection_response(data):
    print(f"✅ Connection verified. User ID: {data.get('user_id')}")

@sio.event
def disconnect():
    print("❌ Disconnected")

@sio.event
def joined_game(data):
    print(f"✅ Joined game room: {data.get('game_id')}")

def test_connection():
    try:
        print(f"Connecting to {URL} with token for user {user_id}...")
        sio.connect(f"{URL}?token={token}")
        
        # Test joining a game room
        print("Testing join_game event...")
        sio.emit('join_game', {'game_id': 'game-alpha'})
        
        # Keep alive for a bit
        time.sleep(2)
        
        sio.disconnect()
        print("Test complete.")

    except Exception as e:
        print(f"❌ Connection failed: {e}")

if __name__ == '__main__':
    test_connection()
