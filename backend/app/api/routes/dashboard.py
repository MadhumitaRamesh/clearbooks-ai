from fastapi import APIRouter
from collections import defaultdict

from app.db.supabase_client import get_supabase
from app.schemas import DashboardOut, TopItem, Prediction
from app.api.routes.records import FAKE_OWNER_ID

router = APIRouter(prefix="/api/v1/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardOut)
async def get_dashboard():
    supabase = get_supabase()

    # Every record for this owner, then every insight row for those records.
    records_res = (
        supabase.table("records").select("id").eq("owner_id", FAKE_OWNER_ID).execute()
    )
    record_ids = [r["id"] for r in records_res.data]

    if not record_ids:
        return DashboardOut(summary="No records yet.", top_items=[], predictions=[], alerts=[])

    insights_res = (
        supabase.table("insights").select("*").in_("record_id", record_ids).execute()
    )

    totals: dict[str, float] = defaultdict(float)
    all_alerts: list[str] = []
    latest_summary = ""

    for row in insights_res.data:
        data = row["insight_json"]
        for item in data.get("top_items", []):
            totals[item["item"]] += item.get("total_sales", 0)
        all_alerts.extend(data.get("alerts", []))
        latest_summary = data.get("summary", latest_summary)

    top_items = [TopItem(item=k, total_sales=v) for k, v in
                 sorted(totals.items(), key=lambda kv: kv[1], reverse=True)]

    # Naive placeholder prediction: same as this period's total.
    # Person 2 can replace this with a real Gemini-driven forecast later.
    predictions = [Prediction(item=t.item, predicted_demand_next_week=t.total_sales) for t in top_items[:5]]

    return DashboardOut(
        summary=latest_summary or "Aggregated insights across all records.",
        top_items=top_items,
        predictions=predictions,
        alerts=list(dict.fromkeys(all_alerts)),  # dedupe, keep order
    )
