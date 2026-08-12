import os
from dotenv import load_dotenv
from supabase import create_client, Client

load_dotenv()

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

try:
    # 1. Create fake user in auth.users
    user = supabase.auth.admin.create_user({
        "email": "test@clearbooks.ai",
        "password": "password123",
        "email_confirm": True
    })
    
    user_id = user.user.id
    print(f"Created Auth User: {user_id}")
    
    # 2. Insert into profiles
    supabase.table("profiles").insert({
        "id": user_id,
        "owner_name": "Test User",
        "shop_name": "ClearBooks Test Shop"
    }).execute()
    print(f"Created Profile for User: {user_id}")
    
    print(f"\nSUCCESS! Use this UUID as FAKE_OWNER_ID: {user_id}")

except Exception as e:
    print(f"Error: {e}")
