import requests
import uuid
import time
import json

# Configuration
USER_PROFILE_URL = "http://localhost:5000"
LEADERBOARD_URL = "http://localhost:5004"
INTERNAL_API_KEY = "dev_internal_key"

def verify_leaderboard_flow():
    print("Starting Leaderboard Flow Verification...")

    # 1. Create a Test User (via Internal Create or assume exists?)
    # Let's create one to be sure.
    user_id = str(uuid.uuid4())
    username = f"TestUser_{user_id[:8]}"
    email = f"{username}@example.com"
    
    print(f"1. Creating Profile for {username} ({user_id})...")
    
    headers = {"X-Internal-API-Key": INTERNAL_API_KEY}
    create_payload = {
        "user_id": user_id,
        "email": email,
        "username": username,
        "full_name": "Test User"
    }
    
    try:
        resp = requests.post(f"{USER_PROFILE_URL}/internal/create", json=create_payload, headers=headers)
        if resp.status_code not in [200, 201]:
            print(f"❌ Failed to create profile: {resp.text}")
            return
        print("✅ Profile Created.")
    except Exception as e:
        print(f"❌ Connection error to User Profile: {e}")
        return

    # 2. Update ELO (Simulate Game Win)
    print("\n2. Updating ELO (Win +25)...")
    elo_payload = {
        "user_id": user_id,
        "elo_change": 25,
        "outcome": "win"
    }
    
    try:
        resp = requests.put(f"{USER_PROFILE_URL}/internal/elo", json=elo_payload, headers=headers)
        if resp.status_code != 200:
            print(f"❌ Failed to update ELO: {resp.text}")
            return
        data = resp.json()
        print(f"✅ ELO Updated. New ELO: {data.get('elo_rating')}")
    except Exception as e:
        print(f"❌ Connection error to User Profile: {e}")
        return

    # 3. Wait for Event Propagation
    print("\n3. Waiting for Event Propagation to Leaderboard (2s)...")
    time.sleep(2)

    # 4. Check Leaderboard
    print("4. Checking Leaderboard...")
    try:
        resp = requests.get(f"{LEADERBOARD_URL}/leaderboard/{user_id}")
        if resp.status_code == 200:
            data = resp.json()
            print(f"✅ User found on Leaderboard!")
            print(f"   Rank: {data.get('rank')}")
            print(f"   ELO:  {data.get('elo')}")
            print(f"   Name: {data.get('username')}")
            
            if data.get('elo') == 1025:
                print("\n🎉 SUCCESS: ELO matches expected value!")
            else:
                print(f"\n⚠️ WARNING: ELO mismatch. Expected 1025, got {data.get('elo')}")
        else:
            print(f"❌ User not found on Leaderboard (Status {resp.status_code}): {resp.text}")
            # Try getting global list to see debugging info
            print("   Fetching Top 10 for debug...")
            resp_list = requests.get(f"{LEADERBOARD_URL}/leaderboard?limit=10")
            print(f"   Top 10: {resp_list.json()}")

    except Exception as e:
        print(f"❌ Connection error to Leaderboard: {e}")
        return

if __name__ == "__main__":
    verify_leaderboard_flow()
