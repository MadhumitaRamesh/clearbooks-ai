"""
STUB - Person 2 owns this file and will replace the body with a real
Gemini structured-output call. Keep the function signature and the
exact return schema (matches app/schemas.py Structured) as-is so
routes.py never has to change, only this file's contents.
"""


def structure_text(raw_text: str) -> dict:
    return {
        "transactions": [
            {"item": "Rice 5kg", "quantity": 2, "unit_price": 250, "total": 500, "type": "sale"},
            {"item": "Sugar 1kg", "quantity": 1, "unit_price": 45, "total": 45, "type": "sale"},
            {"item": "Oil 1L", "quantity": 1, "unit_price": 180, "total": 180, "type": "sale"},
        ]
    }
