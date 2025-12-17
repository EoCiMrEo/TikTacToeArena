import requests
import sys
import time
from concurrent.futures import ThreadPoolExecutor

SERVICES = {
    "Auth Service": "http://localhost:5001",
    "User Profile Service": "http://localhost:5000",
    "Game Service": "http://localhost:5002",
    "Matchmaking Service": "http://localhost:5003",
    "Leaderboard Service": "http://localhost:5004",
    "WebSocket Gateway": "http://localhost:5005"
}

def check_service(name, url):
    try:
        # Pinging a common health endpoint. If not standard, may need adjustments.
        # Assuming most services have a root or /health endpoint depending on implementation.
        # Using a specialized path for auth if needed, but root usually returns something.
        
        target = f"{url}/" 
        if "Auth" in name:
            target = f"{url}/auth/health" # Typical Flask convention or check docs
        elif "Game" in name:
            target = f"{url}/games/active/test_uuid" 
        
        # Try simple GET first
        start = time.time()
        try:
            resp = requests.get(url, timeout=2) # Check root first for 404 or 200
            status = resp.status_code
        except:
             # If root fails, maybe it only has specific routes. Try a known 404
             status = "ERR"
             
        latency = (time.time() - start) * 1000
        
        if status != "ERR" and status < 500:
             msg = f"[OK] {name}: UP (Status: {status}, Latency: {latency:.2f}ms)"
             print(msg)
             with open("verification.log", "a") as f: f.write(msg + "\n")
             return True
        else:
             msg = f"[FAIL] {name}: DOWN (Connection failed or 500 status: {status})"
             print(msg)
             with open("verification.log", "a") as f: f.write(msg + "\n")
             return False
    except Exception as e:
        msg = f"[FAIL] {name}: DOWN ({str(e)})"
        print(msg)
        with open("verification.log", "a") as f: f.write(msg + "\n")
        return False

def verify_all():
    with open("verification.log", "w") as f: f.write("Starting Verification...\n")
    print("Verifying System Health...\n")
    results = {}
    with ThreadPoolExecutor(max_workers=6) as executor:
        futures = {executor.submit(check_service, name, url): name for name, url in SERVICES.items()}
        for future in futures:
            name = futures[future]
            results[name] = future.result()
            
    success_count = sum(results.values())
    summary = f"\nSystem Status: {success_count}/{len(SERVICES)} Services Online"
    print(summary)
    with open("verification.log", "a") as f: f.write(summary + "\n")
    
    if success_count == len(SERVICES):
        print("[SUCCESS] ALL SYSTEMS GO")
        sys.exit(0)
    else:
        print("[WARNING] SYSTEM DEGRADED")
        sys.exit(1)

if __name__ == "__main__":
    verify_all()
