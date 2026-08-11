"""
STUB - Person 2 owns this file and will replace the body with a real
Gemini insights-generation call. Keep the function signature and the
exact return schema (matches app/schemas.py InsightsOut) as-is so
routes.py never has to change, only this file's contents.
"""


def generate_insights(transactions: list[dict]) -> dict:
    return {
        "summary": "Rice sales are up 20% this week compared to last week.",
        "top_items": [{"item": "Rice 5kg", "total_sales": 500}],
        "predictions": [{"item": "Rice 5kg", "predicted_demand_next_week": 15}],
        "alerts": ["Sugar stock running low — reorder soon."],
    }
