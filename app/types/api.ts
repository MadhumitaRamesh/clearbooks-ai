export type RecordStatus = 'pending' | 'processing' | 'done' | 'failed';

export interface Transaction {
  item: string;
  quantity: number;
  unit_price: number;
  total: number;
  type: 'sale' | 'purchase';
  date: string; // YYYY-MM-DD
}

export interface RecordDetail {
  record: {
    id: string;
    status: RecordStatus;
    source_type: 'image' | 'audio';
    created_at: string;
  };
  extracted: {
    raw_text: string;
    structured: { transactions: Transaction[] };
  };
  insights: {
    summary: string;
    top_items: { item: string; total_sales: number }[];
    predictions: { item: string; predicted_demand_next_week: number }[];
    alerts: string[];
  };
}
