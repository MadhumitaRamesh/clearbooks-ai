// lib/mockApi.ts
// Fallback stub — Person 1 owns the real version of this file with richer
// fake data for screen design. This one exists so Person 4 can test
// navigation end-to-end before either Person 1's mock or Person 3's real
// backend is ready. If Person 1 has already pushed their own mockApi.ts,
// pull theirs and delete this one rather than merging — same file, same
// exported names, no reason to keep both.

import type { FullRecord, RecordListItem, DashboardData } from "./types";

const FAKE_RECORD: FullRecord = {
  record: {
    id: "mock-record-1",
    status: "done",
    source_type: "image",
    created_at: new Date().toISOString(),
  },
  extracted: {
    raw_text: "Rice 5kg 2 x 250 = 500 ...",
    structured: {
      transactions: [
        { item: "Rice 5kg", quantity: 2, unit_price: 250, total: 500, type: "sale" },
      ],
    },
  },
  insights: {
    summary: "Rice sales are up 20% this week compared to last week.",
    top_items: [{ item: "Rice 5kg", total_sales: 500 }],
    predictions: [{ item: "Rice 5kg", predicted_demand_next_week: 15 }],
    alerts: ["Sugar stock running low — reorder soon."],
  },
};

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function uploadImage(_fileUri: string): Promise<FullRecord> {
  await delay(800);
  return FAKE_RECORD;
}

export async function uploadAudio(_fileUri: string): Promise<FullRecord> {
  await delay(800);
  return { ...FAKE_RECORD, record: { ...FAKE_RECORD.record, source_type: "audio" } };
}

export async function getRecord(id: string): Promise<FullRecord> {
  await delay(300);
  return { ...FAKE_RECORD, record: { ...FAKE_RECORD.record, id } };
}

export async function getHistory(): Promise<RecordListItem[]> {
  await delay(300);
  return [
    FAKE_RECORD.record,
    { id: "mock-record-2", status: "processing", source_type: "audio", created_at: new Date().toISOString() },
    { id: "mock-record-3", status: "failed", source_type: "image", created_at: new Date().toISOString() },
  ];
}

export async function getDashboard(): Promise<DashboardData> {
  await delay(300);
  return {
    summary: "Weekly sales up 12% overall.",
    top_items: FAKE_RECORD.insights.top_items,
    predictions: FAKE_RECORD.insights.predictions,
    alerts: FAKE_RECORD.insights.alerts,
  };
}

export async function pollRecordUntilDone(id: string): Promise<FullRecord> {
  return getRecord(id);
}

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}
