"""
SHARED FILE - everyone imports this.
If you need to change it, message the group first (per docs/CONTRACT.md).

These models mirror the "Response shape" JSON block in docs/CONTRACT.md exactly.
Person 1/4 mock against this shape; Person 2's AI functions must return dicts
that fit `Extracted` and `Insights` exactly.
"""

from datetime import datetime
from typing import Literal, Optional, Any
from pydantic import BaseModel


# ---------- records ----------

class RecordOut(BaseModel):
    id: str
    status: Literal["pending", "processing", "done", "failed"]
    source_type: Literal["image", "audio"]
    created_at: datetime


# ---------- extracted_data ----------

class Transaction(BaseModel):
    item: str
    quantity: float
    unit_price: float
    total: float
    type: Optional[str] = None  # e.g. "sale" / "purchase" — kept loose on purpose


class Structured(BaseModel):
    transactions: list[Transaction]


class ExtractedOut(BaseModel):
    raw_text: str
    structured: Structured


# ---------- insights ----------

class TopItem(BaseModel):
    item: str
    total_sales: float


class Prediction(BaseModel):
    item: str
    predicted_demand_next_week: float


class InsightsOut(BaseModel):
    summary: str
    top_items: list[TopItem]
    predictions: list[Prediction]
    alerts: list[str]


# ---------- combined response (what every /records endpoint returns) ----------

class FullRecordOut(BaseModel):
    record: RecordOut
    extracted: Optional[ExtractedOut] = None
    insights: Optional[InsightsOut] = None


class RecordListOut(BaseModel):
    records: list[RecordOut]


class DashboardOut(BaseModel):
    summary: str
    top_items: list[TopItem]
    predictions: list[Prediction]
    alerts: list[str]
