// lib/backend.ts
// Screens import from here, not from api.ts or mockApi.ts directly.
// Toggle EXPO_PUBLIC_USE_MOCK=true in .env to develop nav/UI without a
// running backend; flip to false (or unset) once Person 3's endpoints are live.

import * as real from "./api";
import * as mock from "./mockApi";

const USE_MOCK = process.env.EXPO_PUBLIC_USE_MOCK === "true";

export const {
  uploadImage,
  uploadAudio,
  getRecord,
  getHistory,
  getDashboard,
  pollRecordUntilDone,
  ApiError,
} = USE_MOCK ? mock : real;
