import os
import sys
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

# Load env variables
load_dotenv()

database_url = os.getenv('DATABASE_URL')
print(f"Loaded DATABASE_URL: {database_url.split('@')[-1] if database_url and '@' in database_url else 'None (or invalid format)'}")

if not database_url:
    print("Error: DATABASE_URL is not set in .env")
    sys.exit(1)

# Fix deprecated postgres:// scheme
if database_url.startswith("postgres://"):
    print("Detected deprecated 'postgres://' scheme. Converting to 'postgresql://'...")
    database_url = database_url.replace("postgres://", "postgresql://", 1)

try:
    print(f"Attempting to connect to: {database_url.split('@')[-1]}...")
    engine = create_engine(database_url)
    with engine.connect() as connection:
        result = connection.execute(text("SELECT NOW()"))
        print("Connection Successful!")
        print(f"Server Time: {result.fetchone()[0]}")
except Exception as e:
    print(f"Connection Failed!")
    print(f"Error Type: {type(e).__name__}")
    print(f"Error Message: {str(e)}")
