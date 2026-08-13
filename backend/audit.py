import os
from supabase import create_client, Client
from dotenv import load_dotenv

load_dotenv()

supabase: Client = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_KEY"])

def audit():
    print("=== Supabase Database Audit ===")
    
    # 1. Check Records
    print("\n--- Records Table ---")
    records = supabase.table("records").select("*").order("created_at", desc=True).limit(2).execute()
    for r in records.data:
        print(r)
    
    # 2. Check Extracted Data
    print("\n--- Extracted Data Table ---")
    extracted = supabase.table("extracted_data").select("*").limit(2).execute()
    for e in extracted.data:
        # Truncate raw_text for readability
        if "raw_text" in e and len(e["raw_text"]) > 100:
            e["raw_text"] = e["raw_text"][:100] + "..."
        print(e)
    
    # 3. Check Insights Data
    print("\n--- Insights Table ---")
    insights = supabase.table("insights").select("*").limit(2).execute()
    for i in insights.data:
        print(i)
    
    # 4. Check Storage Bucket
    print("\n--- Storage Bucket ('records') ---")
    try:
        files = supabase.storage.from_("records").list()
        print(files)
    except Exception as exc:
        print(f"Error reading bucket: {exc}")

if __name__ == "__main__":
    audit()
