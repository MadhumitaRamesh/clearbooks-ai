"""
generate_insights(transactions: list[dict]) -> dict

Uses Gemini to analyze a list of transactions (can span multiple past records)
and return exactly:

{
  "summary": "string",
  "top_items": [{"item": "string", "total_sales": number}],
  "predictions": [{"item": "string", "predicted_demand_next_week": number}],
  "alerts": ["string"]
}

Env vars required:
  GEMINI_API_KEY
"""

import os
import sys
import json

import google.generativeai as genai

MODEL_NAME = "gemini-3.5-flash"

SYSTEM_PROMPT = """You are a business-insights assistant for a small shop owner. \
You will be given a JSON list of transactions (sales and purchases, each with \
item, quantity, unit_price, total, type, date). Analyze them and produce a \
plain-language, encouraging but honest summary for a non-technical shop owner.

Rules:
- Output ONLY valid JSON matching the schema below. No markdown, no commentary, no code fences.
- "summary" should be 1-3 short sentences a shop owner can read at a glance \
(e.g. trends, standout items, general health of the business).
- "top_items" should list the highest-selling items by total sale value, most first. \
Cap at 5 items. If there is not enough sales data, return an empty list.
- "predictions" should give a rough demand estimate for next week for items with \
enough history to guess from. It's fine for this to be a simple trend extrapolation. \
Cap at 5 items. If there is not enough data, return an empty list.
- "alerts" should flag anything the owner should act on: low/no recent sales for a \
normally-active item, unusually high purchases with no matching sales (possible \
overstock), or missing/incomplete data worth mentioning. If nothing stands out, \
return an empty list — do not invent alerts.
- If the transactions list is empty, return {"summary": "No data yet — add a record to get started.", "top_items": [], "predictions": [], "alerts": []}.

Schema:
{
  "summary": "string",
  "top_items": [{"item": "string", "total_sales": number}],
  "predictions": [{"item": "string", "predicted_demand_next_week": number}],
  "alerts": ["string"]
}
"""


def _get_model() -> "genai.GenerativeModel":
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        MODEL_NAME,
        generation_config={"response_mime_type": "application/json", "max_output_tokens": 4096},
    )


def generate_insights(transactions: list[dict]) -> dict:
    """Analyze a list of transactions and return the insights schema via Gemini."""
    if not transactions:
        return {
            "summary": "No data yet — add a record to get started.",
            "top_items": [],
            "predictions": [],
            "alerts": [],
        }

    model = _get_model()

    response = model.generate_content(
        [SYSTEM_PROMPT, f"Transactions:\n\n{json.dumps(transactions, indent=2)}"]
    )

    try:
        data = json.loads(response.text)
    except (json.JSONDecodeError, AttributeError) as e:
        raise ValueError(f"Gemini did not return valid JSON: {e}\nRaw response: {getattr(response, 'text', response)}")

    # Defensive normalization / fallback shape so a malformed model
    # response can't crash Person 3's endpoint code.
    return {
        "summary": str(data.get("summary", "")),
        "top_items": data.get("top_items", []) or [],
        "predictions": data.get("predictions", []) or [],
        "alerts": data.get("alerts", []) or [],
    }


if __name__ == "__main__":
    # Test with fake transactions — no external files needed.
    sample_transactions = [
        {"item": "Rice 5kg", "quantity": 2, "unit_price": 250, "total": 500, "type": "sale", "date": "2026-08-03"},
        {"item": "Rice 5kg", "quantity": 3, "unit_price": 250, "total": 750, "type": "sale", "date": "2026-08-10"},
        {"item": "Sugar 1kg", "quantity": 1, "unit_price": 45, "total": 45, "type": "sale", "date": "2026-07-20"},
        {"item": "Cooking Oil 5L", "quantity": 10, "unit_price": 180, "total": 1800, "type": "purchase", "date": "2026-08-05"},
    ]

    if len(sys.argv) > 1:
        # Optionally pass a path to a .json file: python insights.py sample.json
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            sample_transactions = json.load(f)

    print("Input transactions:")
    print(json.dumps(sample_transactions, indent=2))
    result = generate_insights(sample_transactions)
    print("\nInsights output:")
    print(json.dumps(result, indent=2))
