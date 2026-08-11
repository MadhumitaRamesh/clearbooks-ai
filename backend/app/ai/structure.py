"""
structure_text(raw_text: str) -> dict

Uses Gemini in JSON mode to turn messy raw text (from OCR or speech-to-text)
into a strict transactions schema:

{
  "transactions": [
    {
      "item": "string",
      "quantity": number,
      "unit_price": number,
      "total": number,
      "type": "sale" | "purchase",
      "date": "YYYY-MM-DD"
    }
  ]
}

Env vars required:
  GEMINI_API_KEY
"""

import os
import sys
import json
from datetime import date

import google.generativeai as genai

MODEL_NAME = "gemini-2.0-flash"

SYSTEM_PROMPT = """You are a data-extraction engine for a small shop's handwritten \
or spoken sales/purchase records. You will be given messy raw text (from OCR of \
handwriting, or a speech-to-text transcript, possibly in Hinglish or mixed \
Indian-language text). Extract every distinct transaction you can find.

Rules:
- Output ONLY valid JSON matching the schema below. No markdown, no commentary, no code fences.
- "type" must be either "sale" or "purchase". If unclear, infer from context \
(shopkeeper describing goods going out = sale, goods coming in = purchase); \
default to "sale" if truly ambiguous.
- "quantity" and "unit_price" and "total" must be numbers (not strings). If total \
is missing but quantity and unit_price are present, compute total = quantity * unit_price. \
If unit_price is missing but total and quantity are present, compute unit_price = total / quantity.
- "date" must be in YYYY-MM-DD format. If no date is mentioned in the text, use \
today's date, which is {today}.
- If you genuinely cannot find any transactions, return {{"transactions": []}}.

Schema:
{{
  "transactions": [
    {{"item": "string", "quantity": number, "unit_price": number, "total": number, "type": "sale|purchase", "date": "YYYY-MM-DD"}}
  ]
}}
"""


def _get_model() -> "genai.GenerativeModel":
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError("GEMINI_API_KEY environment variable is not set")
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(
        MODEL_NAME,
        generation_config={"response_mime_type": "application/json"},
    )


def structure_text(raw_text: str) -> dict:
    """Turn raw OCR/STT text into the transactions schema using Gemini JSON mode."""
    if not raw_text or not raw_text.strip():
        return {"transactions": []}

    model = _get_model()
    prompt = SYSTEM_PROMPT.format(today=date.today().isoformat())

    response = model.generate_content(
        [prompt, f"Raw text to extract from:\n\n{raw_text}"]
    )

    try:
        data = json.loads(response.text)
    except (json.JSONDecodeError, AttributeError) as e:
        raise ValueError(f"Gemini did not return valid JSON: {e}\nRaw response: {getattr(response, 'text', response)}")

    # Defensive normalization so a slightly-off model response doesn't
    # crash Person 3's endpoint code downstream.
    transactions = data.get("transactions", [])
    normalized = []
    for t in transactions:
        try:
            quantity = float(t.get("quantity", 0))
            unit_price = float(t.get("unit_price", 0))
            total = float(t.get("total", quantity * unit_price))
        except (TypeError, ValueError):
            continue
        normalized.append({
            "item": str(t.get("item", "")).strip(),
            "quantity": quantity,
            "unit_price": unit_price,
            "total": total,
            "type": t.get("type") if t.get("type") in ("sale", "purchase") else "sale",
            "date": t.get("date") or date.today().isoformat(),
        })

    return {"transactions": normalized}


if __name__ == "__main__":
    # Test with fake raw text — no external files needed.
    sample_raw_text = (
        "Rice 5kg 2 x 250 = 500\n"
        "Sugar 1kg 3 x 45 = 135\n"
        "bought oil 5 liters at 180 each yesterday\n"
    )

    if len(sys.argv) > 1:
        # Optionally pass a path to a .txt file: python structure.py sample.txt
        with open(sys.argv[1], "r", encoding="utf-8") as f:
            sample_raw_text = f.read()

    print("Input raw text:\n" + sample_raw_text)
    result = structure_text(sample_raw_text)
    print("\nStructured output:")
    print(json.dumps(result, indent=2))
