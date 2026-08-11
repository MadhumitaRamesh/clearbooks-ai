// lib/types.ts
// Mirrors backend/app/schemas.py exactly. If the backend contract changes,
// this file and mockApi.ts's fake data both need to change together.

export type RecordStatus = "pending" | "processing" | "done" | "failed";
export type SourceType = "image" | "audio";

export interface Transaction {
  item: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: "sale" | "purchase";
}

export interface StructuredData {
  transactions: Transaction[];
}

export interface ExtractedData {
  raw_text: string;
  structured: StructuredData;
}

export interface TopItem {
  item: string;
  total_sales: number;
}

export interface Prediction {
  item: string;
  predicted_demand_next_week: number;
}

export interface Insights {
  summary: string;
  top_items: TopItem[];
  predictions: Prediction[];
  alerts: string[];
}

export interface RecordMeta {
  id: string;
  status: RecordStatus;
  source_type: SourceType;
  created_at: string;
}

// The exact shape every endpoint below returns for a single record.
export interface FullRecord {
  record: RecordMeta;
  extracted: ExtractedData;
  insights: Insights;
}

// GET /api/v1/records — list response
export type RecordListItem = RecordMeta;

// GET /api/v1/dashboard — aggregated insights across all records
export interface DashboardData {
  summary: string;
  top_items: TopItem[];
  predictions: Prediction[];
  alerts: string[];
}
