import os
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL", "")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    # Don't crash on import (useful for tests / early scaffolding),
    # but the app will fail loudly the moment it tries to hit Supabase.
    print("[config] WARNING: SUPABASE_URL / SUPABASE_KEY not set. "
          "Add them to a .env file before running the server for real.")
