import requests
import uuid
import time
import json

BASE_URL = "http://localhost:5002"

def test_game_flow():
    player1_id = str(uuid.uuid4())
    player2_id = str(uuid.uuid4())
    
    print("1. Creating new game...")
    resp = requests.post(f"{BASE_URL}/games", json={
        "player1_id": player1_id,
        "player2_id": player2_id
    })
    
    if resp.status_code != 201:
        print(f"❌ Failed to create game: {resp.text}")
        return
        
    game_data = resp.json()
    game_id = game_data['id']
    print(f"✅ Game created: {game_id}")
    
    print("\n2. Getting game state...")
    resp = requests.get(f"{BASE_URL}/games/{game_id}")
    print(f"✅ State: {resp.json()['status']}")
    
    print("\n3. Making a move (Center - 13x13 has 169 cells. Center is index 84 approx? No 169/2 = 84.5. 13*6+6 = 84)")
    # Center of 13x13: Row 6, Col 6. Index = 6*13 + 6 = 78+6 = 84.
    
    move_resp = requests.post(f"{BASE_URL}/games/{game_id}/move", json={
        "user_id": player1_id,
        "position": 84
    })
    
    if move_resp.status_code == 200:
        print("✅ Move successful!")
        board = move_resp.json()['board']
        # Visualize snippet
        print(f"   Center cell: {board[84]}")
    else:
        print(f"❌ Move failed: {move_resp.text}")

    print("\n4. Testing Active Games List...")
    resp = requests.get(f"{BASE_URL}/games/active/{player1_id}")
    if resp.status_code == 200:
        active = resp.json()
        print(f"✅ Active games for {player1_id}: {len(active)}")
        if len(active) > 0:
            print(f"   - First game ID matches? {active[0]['id'] == game_id}")
    else:
        print(f"❌ Failed to get active games: {resp.text}")

    print("\nTest complete.")

if __name__ == "__main__":
    test_game_flow()
