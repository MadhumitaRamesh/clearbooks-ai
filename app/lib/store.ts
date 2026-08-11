// lib/store.ts
// Global state so Home -> Upload -> Preview -> Insights and History -> Detail
// don't need to pass data through route params or prop-drill.

import { create } from "zustand";
import type { FullRecord } from "./types";

interface Owner {
  id: string;
  ownerName: string;
  shopName: string;
}

interface AppState {
  // set once after ensureSession() resolves and profile is fetched/created
  owner: Owner | null;
  setOwner: (owner: Owner | null) => void;

  // the record currently being uploaded/previewed/viewed for insights
  currentRecord: FullRecord | null;
  setCurrentRecord: (record: FullRecord | null) => void;

  // simple network status flags screens can read for spinners/retry UI
  isUploading: boolean;
  setIsUploading: (value: boolean) => void;

  uploadError: string | null;
  setUploadError: (message: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  owner: null,
  setOwner: (owner) => set({ owner }),

  currentRecord: null,
  setCurrentRecord: (record) => set({ currentRecord: record }),

  isUploading: false,
  setIsUploading: (value) => set({ isUploading: value }),

  uploadError: null,
  setUploadError: (message) => set({ uploadError: message }),
}));
