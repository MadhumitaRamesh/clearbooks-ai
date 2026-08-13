// lib/api.ts
// Real backend calls. Function names + signatures match lib/mockApi.ts
// exactly on purpose — swapping a screen from mock to real is a one-line
// import change:
//   import { uploadImage } from "./mockApi";   ->   import { uploadImage } from "./api";

import { getAccessToken } from "./supabase";
import type {
  FullRecord,
  RecordListItem,
  DashboardData,
} from "./types";

// Point at your local backend while developing, swap to the deployed URL
// before demo day. EXPO_PUBLIC_ vars are inlined at build time by Expo.
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getAccessToken();
  console.log("=== ACCESS TOKEN ===", token ? `${token.substring(0, 15)}...` : "null/undefined");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail ?? detail;
    } catch {
      // response wasn't JSON, fall back to statusText
    }
    throw new ApiError(detail, res.status);
  }
  return res.json() as Promise<T>;
}

/** POST /api/v1/records/image — multipart image upload */
export async function uploadImage(fileUri: string): Promise<FullRecord> {
  const form = new FormData();
  // React Native's fetch FormData wants this shape for a file field.
  form.append("file", {
    uri: fileUri,
    name: "record.jpg",
    type: "image/jpeg",
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/api/v1/records/image`, {
    method: "POST",
    headers: await authHeaders(), // don't set Content-Type — fetch sets the multipart boundary
    body: form,
  });
  return handle<FullRecord>(res);
}

/** POST /api/v1/records/audio — multipart audio upload */
export async function uploadAudio(fileUri: string): Promise<FullRecord> {
  const form = new FormData();
  form.append("file", {
    uri: fileUri,
    name: "record.m4a",
    type: "audio/m4a",
  } as unknown as Blob);

  const res = await fetch(`${BASE_URL}/api/v1/records/audio`, {
    method: "POST",
    headers: await authHeaders(),
    body: form,
  });
  return handle<FullRecord>(res);
}

/** GET /api/v1/records/{id} */
export async function getRecord(id: string): Promise<FullRecord> {
  const res = await fetch(`${BASE_URL}/api/v1/records/${id}`, {
    headers: await authHeaders(),
  });
  return handle<FullRecord>(res);
}

/** GET /api/v1/records — history list for the logged-in owner */
export async function getHistory(): Promise<RecordListItem[]> {
  const res = await fetch(`${BASE_URL}/api/v1/records`, {
    headers: await authHeaders(),
  });
  const data = await handle<{records: RecordListItem[]}>(res);
  return data.records;
}

/** GET /api/v1/dashboard — aggregated insights across all records */
export async function getDashboard(): Promise<DashboardData> {
  const res = await fetch(`${BASE_URL}/api/v1/dashboard`, {
    headers: await authHeaders(),
  });
  return handle<DashboardData>(res);
}

/**
 * Polls GET /records/{id} until status is "done" or "failed", or attempts
 * run out. Use this after uploadImage/uploadAudio if the backend returns
 * before OCR/insights finish — screens can show a spinner while this runs.
 */
export async function pollRecordUntilDone(
  id: string,
  { intervalMs = 2000, maxAttempts = 15 }: { intervalMs?: number; maxAttempts?: number } = {}
): Promise<FullRecord> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const record = await getRecord(id);
    if (record.record.status === "done" || record.record.status === "failed") {
      return record;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
  throw new ApiError(`Record ${id} did not finish processing in time`, 408);
}

export { ApiError };
