import os
import time
from dotenv import load_dotenv
from supabase import create_client, Client
import httpx

load_dotenv()

url = os.getenv("SUPABASE_URL")
key = os.getenv("SUPABASE_KEY")

print(f"Loaded configuration:")
print(f"SUPABASE_URL: '{url}'")
print(f"SUPABASE_KEY: '{key[:10]}...' (length: {len(key) if key else 0})")

if not url:
    print("ERROR: SUPABASE_URL is empty!")
    exit(1)

if "your-project-url" in url:
    print("ERROR: SUPABASE_URL is still the default placeholder!")
    exit(1)

if not url.startswith("http"):
    print("WARNING: SUPABASE_URL does not start with 'http' or 'https'. This usually causes errors.")

try:
    print(f"\nAttempting to connect to Supabase API at {url}...")
    
    # 1. Test basic HTTP connectivity first
    try:
        r = httpx.get(f"{url}/auth/v1/health", timeout=5)
        print(f"HTTP Connection Test: Status {r.status_code}")
    except Exception as e:
        print(f"HTTP Connection Test Failed: {e}")
        print(">> This confirms the URL is unreachable or DNS is wrong.")

    # 2. Test Supabase Client
    supabase: Client = create_client(url, key)
    # Try a simple auth check (sign in with fake creds should yield 400 Bad Request, not 11001)
    print("\nTesting Supabase Client Auth call...")
    res = supabase.auth.sign_in_with_password({"email": "test@test.com", "password": "fake_password"})
    print("Result:", res)

except Exception as e:
    print(f"\nCRITICAL ERROR: {str(e)}")
    
    if "11001" in str(e) or "getaddrinfo failed" in str(e):
        print("\nDIAGNOSIS: The Hostname in SUPABASE_URL is invalid.")
        print("Please check your .env file.")
        print("Correct Format: https://[YOUR_PROJECT_REF].supabase.co")
        print("Incorrect Examples: ")
        print(" - db.[project].supabase.co (This is for Database, NOT API)")
        print(" - postgres://... (This is for Database)")
