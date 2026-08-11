# Person 4 — Frontend Integration

## What's in here
- `lib/types.ts` — shared TS types matching `backend/app/schemas.py` exactly.
- `lib/supabase.ts` — Supabase client + anonymous sign-in (`ensureSession`).
- `lib/api.ts` — real backend calls: `uploadImage`, `uploadAudio`, `getRecord`,
  `getHistory`, `getDashboard`, plus `pollRecordUntilDone` for the
  processing → done polling loop.
- `lib/mockApi.ts` — fallback fake data with the *same* function signatures
  (Person 1 owns the real version of this file — if theirs exists, use theirs
  and delete this one, don't keep both).
- `lib/backend.ts` — single switch point. Screens import from here, not from
  `api.ts`/`mockApi.ts` directly. Toggle with `EXPO_PUBLIC_USE_MOCK` in `.env`.
- `lib/store.ts` — Zustand global state (`owner`, `currentRecord`, upload
  status/error) so screens don't prop-drill.
- `app/_layout.tsx` — root stack, calls `ensureSession()` on launch.
- `app/index.tsx`, `app/upload.tsx`, `app/preview.tsx`, `app/insights.tsx`,
  `app/history/index.tsx`, `app/history/[id].tsx` — navigation-wired screen
  stubs. Person 1 restyles the JSX; keep the router calls and data hooks.

## Install
```bash
npx expo install @supabase/supabase-js @react-native-async-storage/async-storage \
  react-native-url-polyfill expo-image-picker expo-av zustand
```

## Setup
1. `cp .env.example .env` and fill in `EXPO_PUBLIC_SUPABASE_URL` /
   `EXPO_PUBLIC_SUPABASE_ANON_KEY` (from the Supabase project Person 3 set up)
   and `EXPO_PUBLIC_API_URL` (Person 3's backend URL, or `localhost:8000`).
2. In Supabase dashboard: Authentication → Providers → enable **Anonymous
   sign-ins** (fastest path to a working demo — no OTP flow needed).
3. `EXPO_PUBLIC_USE_MOCK=true` lets you test navigation before the backend
   is live; flip to `false` once Person 3's stubbed endpoints are up.

## Navigation flow wired
`Home → Upload → Data Preview → Insights`, and `History → record detail →
Preview/Insights`. `currentRecord` in the Zustand store carries data between
these screens instead of route params.

## Still to wire once Person 1's real screens land
- Swap the placeholder `View`/`Text`/`TouchableOpacity` JSX in each screen
  for Person 1's actual components — keep the hooks (`useEffect` fetch calls,
  `router.push`/`replace`, `useAppStore` reads) as-is.
- `upload.tsx`'s `handleRecordAudio` needs the real `expo-av` recorder wired
  to Person 1's mic UI once that component exists.
