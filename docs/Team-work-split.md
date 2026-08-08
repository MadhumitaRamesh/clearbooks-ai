# Old Owner → New System: Team Build Plan

**Stack (final):**
- **App:** TypeScript + React Native + Expo (Android)
- **Backend:** Python + FastAPI
- **Database/Auth/Storage:** Supabase (Postgres)
- **AI:** Sarvam AI (Speech-to-Text) · Google Cloud Vision (OCR) · Gemini (structured output + insights)

**Why this split works:** all AI keys (Sarvam, Google Vision, Gemini) live on the **backend only** — never in the mobile app. So Person 2's AI work and Person 3's backend/DB work happen in the same repo folder but as separate modules, and Person 1 + Person 4 build the app against a **mocked API** so nobody waits on anybody. Everyone starts today.

---

## 1. Repo structure

```
old-owner-new-system/
├── app/                     # Person 1 + Person 4 — Expo RN app
│   ├── app/                 # expo-router screens
│   ├── components/
│   ├── lib/api.ts           # single file that calls the backend
│   └── lib/mockApi.ts       # returns fake data matching the real API shape
├── backend/                 # Person 3 (routes/DB) + Person 2 (AI modules)
│   ├── app/
│   │   ├── main.py
│   │   ├── api/routes/      # Person 3
│   │   ├── ai/              # Person 2 — ocr.py, speech.py, structure.py, insights.py
│   │   ├── db/               # Person 3 — Supabase client, models
│   │   └── schemas.py       # SHARED — pydantic models everyone imports
│   └── requirements.txt
├── supabase/
│   └── schema.sql           # Person 3
└── docs/
    └── CONTRACT.md          # the file below — the source of truth
```

## 2. Git workflow (so 4 people can push at once without blocking each other)

1. One person creates the repo on GitHub, adds the structure above, pushes `main`.
2. Everyone clones, then works **only inside their own folder**:
   - Person 1 → `app/app/`, `app/components/`
   - Person 2 → `backend/app/ai/`
   - Person 3 → `backend/app/api/`, `backend/app/db/`, `supabase/`
   - Person 4 → `app/lib/`, wiring + navigation
3. Branch naming: `feat/person1-ui`, `feat/person2-ai`, `feat/person3-backend`, `feat/person4-integration`.
4. Commit small, push often (every 1–2 hrs), open a PR into `main`, merge your own PR once it builds — don't wait for review during the hackathon, just don't force-push over others.
5. **`backend/app/schemas.py`** and **`docs/CONTRACT.md`** are the only shared files. If you need to change them, message the group first.

---

## 3. The shared contract (everyone reads this once, first)

### Database tables (Supabase)

```sql
-- supabase/schema.sql
create table profiles (
  id uuid primary key references auth.users(id),
  owner_name text,
  shop_name text,
  created_at timestamptz default now()
);

create table records (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references profiles(id),
  source_type text check (source_type in ('image','audio')),
  file_url text,
  status text check (status in ('pending','processing','done','failed')) default 'pending',
  created_at timestamptz default now()
);

create table extracted_data (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id),
  raw_text text,
  structured_json jsonb,
  created_at timestamptz default now()
);

create table insights (
  id uuid primary key default gen_random_uuid(),
  record_id uuid references records(id),
  summary text,
  insight_json jsonb,
  created_at timestamptz default now()
);
```

### API endpoints (Person 3 builds these; Person 4 calls these)

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/v1/records/image` | multipart image upload → creates record, runs OCR+Gemini, returns full record |
| POST | `/api/v1/records/audio` | multipart audio upload → creates record, runs Sarvam STT+Gemini, returns full record |
| GET | `/api/v1/records/{id}` | fetch one record with extracted_data + insights |
| GET | `/api/v1/records` | list history for the logged-in owner |
| GET | `/api/v1/dashboard` | aggregated insights across all records |

### Response shape (this is what Person 1/4 should mock, and what Person 2/3 must return)

```json
{
  "record": {
    "id": "uuid",
    "status": "done",
    "source_type": "image",
    "created_at": "2026-08-10T10:00:00Z"
  },
  "extracted": {
    "raw_text": "Rice 5kg 2 x 250 = 500 ...",
    "structured": {
      "transactions": [
        { "item": "Rice 5kg", "quantity": 2, "unit_price": 250, "total": 500, "type": "sale", "date": "2026-08-10" }
      ]
    }
  },
  "insights": {
    "summary": "Rice sales are up 20% this week compared to last week.",
    "top_items": [{ "item": "Rice 5kg", "total_sales": 500 }],
    "predictions": [{ "item": "Rice 5kg", "predicted_demand_next_week": 15 }],
    "alerts": ["Sugar stock running low — reorder soon."]
  }
}
```

Person 2's AI functions must return exactly the `extracted` and `insights` objects above — nothing more, nothing less. That's what lets Person 3 wire them in without renegotiating anything.

---

## 4. Person 1 — UI/UX (screens + design system)

**Copy-paste this into a new Claude chat (or Claude Code) to start:**

> I'm building the mobile app for a hackathon project called "Old Owner → New System" — it helps small shop owners digitize handwritten records (photo or voice) and get AI insights. I'm building the **UI/UX layer only**, in **React Native + Expo + TypeScript**, using `expo-router` for navigation.
>
> Help me build the following screens as reusable, well-styled components with **mock data only** (no backend calls yet — a teammate wires that up later):
> 1. **Login/Onboarding** — shop name + owner name, simple and friendly
> 2. **Home/Dashboard** — big "Upload Photo" and "Record Voice" buttons, recent activity list, an insights summary card
> 3. **Upload/Record screen** — camera/gallery picker for photos, mic recorder for voice, with a clear "Processing..." state
> 4. **Data Preview screen** — shows extracted structured data (a table of items/quantities/prices) so the owner can confirm it's correct before saving
> 5. **Insights screen** — summary text, a simple bar chart of top items, a predictions list, and an alerts section (e.g. "low stock")
> 6. **History screen** — list of past records with status badges (pending/processing/done/failed)
>
> Design direction: warm, simple, trustworthy — this is for a shop owner who isn't tech-savvy, not a startup dashboard. Big touch targets, clear icons, minimal text. Use a consistent color/typography system across all screens.
>
> Structure the mock data to exactly match this JSON shape so it's a drop-in swap later:
> [paste the "Response shape" JSON block from above]
>
> Start with the design system (colors, typography, spacing) and the Home screen, then move through the list in order.

**Your first real task today:** get Home + Upload + Data Preview screens rendering with mock data, pushed to `feat/person1-ui`.

---

## 5. Person 2 — AI (OCR + Speech + Gemini structuring + insights)

**Copy-paste this into a new Claude chat to start:**

> I'm building the **AI layer** for a hackathon backend in **Python**. The full backend is FastAPI, but I'm working standalone first — just Python functions a teammate will import into FastAPI routes later. No web server needed from me yet.
>
> I need four independent functions, each testable from the command line with a sample file:
>
> 1. `ocr_image(image_bytes: bytes) -> str` — uses **Google Cloud Vision API** to extract raw text from a photo of a handwritten/printed shop record.
> 2. `transcribe_audio(audio_bytes: bytes) -> str` — uses **Sarvam AI's Speech-to-Text API** to transcribe a voice note (owner describing sales) into text. Support Indian languages/Hinglish if the API allows it.
> 3. `structure_text(raw_text: str) -> dict` — uses **Gemini** with a structured-output/JSON-mode prompt to turn messy raw text into this exact schema:
> ```json
> { "transactions": [ { "item": "string", "quantity": number, "unit_price": number, "total": number, "type": "sale|purchase", "date": "YYYY-MM-DD" } ] }
> ```
> 4. `generate_insights(transactions: list[dict]) -> dict` — uses Gemini to analyze a list of transactions (can be from multiple past records) and return exactly:
> ```json
> { "summary": "string", "top_items": [{"item": "string", "total_sales": number}], "predictions": [{"item": "string", "predicted_demand_next_week": number}], "alerts": ["string"] }
> ```
>
> Set this up as a Python package `backend/app/ai/` with `ocr.py`, `speech.py`, `structure.py`, `insights.py`, each with a `if __name__ == "__main__"` block so I can test with a sample file from the terminal before anyone wires it into the API. Use environment variables for all API keys (`GOOGLE_APPLICATION_CREDENTIALS`, `SARVAM_API_KEY`, `GEMINI_API_KEY`) — don't hardcode anything. Start with `structure.py` since I can test it with fake raw text immediately without any external files.

**Your first real task today:** get `structure.py` working end-to-end with a fake raw-text string, since it needs no test files. Then OCR with one sample photo, then speech, then insights. Push to `feat/person2-ai` — Person 3 will import your functions directly, so keep function signatures exactly as above.

---

## 6. Person 3 — Backend + Database (FastAPI + Supabase)

**Copy-paste this into a new Claude chat to start:**

> I'm building the **backend** for a hackathon project in **Python + FastAPI**, with **Supabase Postgres** as the database, storage, and auth provider. A teammate is separately building AI functions (`ocr_image`, `transcribe_audio`, `structure_text`, `generate_insights`) that I'll import from `app/ai/` once they're ready — for now I want to **stub them with fake return values** so I'm not blocked.
>
> Set up:
> 1. A FastAPI project in `backend/` with a Supabase client (`supabase-py`) initialized from env vars (`SUPABASE_URL`, `SUPABASE_KEY`).
> 2. This Postgres schema (also save as `supabase/schema.sql`):
> [paste the SQL block from above]
> 3. These endpoints in `app/api/routes/`:
>    - `POST /api/v1/records/image` — accept multipart image upload, upload the file to Supabase Storage, insert a `records` row (`status='processing'`), call `ocr_image` then `structure_text` (stubbed for now), insert into `extracted_data`, call `generate_insights` (stubbed), insert into `insights`, update `records.status='done'`, return the full combined object.
>    - `POST /api/v1/records/audio` — same flow using `transcribe_audio` instead of `ocr_image`.
>    - `GET /api/v1/records/{id}` — join records + extracted_data + insights, return the combined object.
>    - `GET /api/v1/records` — list all records for the current owner, most recent first.
>    - `GET /api/v1/dashboard` — aggregate insights across all of an owner's records.
> 4. Pydantic models in `app/schemas.py` matching exactly this response shape, since a teammate's mobile app is being built against it:
> [paste the "Response shape" JSON block from above]
>
> Wrap the AI calls so if they raise an exception, the record's status is set to `failed` instead of crashing the request — reliability matters more than features for the demo.

**Your first real task today:** get all 5 endpoints running locally and returning stubbed/fake data with the correct shape, so Person 4 can start integrating immediately. Push to `feat/person3-backend`. Swap in Person 2's real AI functions as soon as they're ready — the endpoint code shouldn't need to change, just the import.

---

## 7. Person 4 — Frontend integration (connect app ↔ backend)

**Copy-paste this into a new Claude chat to start:**

> I'm doing **integration** for a hackathon app: **Expo/React Native/TypeScript** frontend, **FastAPI** backend, **Supabase** for auth. A teammate is building the screens with mock data (`app/lib/mockApi.ts`); another is building the FastAPI backend at these endpoints:
> [paste the endpoints table from above]
> ...returning this shape:
> [paste the "Response shape" JSON block from above]
>
> Build `app/lib/api.ts` with typed functions (`uploadImage`, `uploadAudio`, `getRecord`, `getHistory`, `getDashboard`) that call the real backend using `fetch`/`axios`, matching the exact function signatures the mock file uses — so swapping `mockApi` → `api` in each screen is a one-line change. Also set up:
> 1. Supabase auth (email/anonymous or phone OTP — whichever is fastest to demo) so requests carry the owner's session.
> 2. `expo-router` navigation wiring so screens actually flow: Home → Upload → Data Preview → Insights, and History → record detail.
> 3. A simple global state (React Context or Zustand) for "current owner" and "current record" so screens don't need prop-drilling.
>
> For now, point `api.ts` at `http://localhost:8000` (or the deployed backend URL once it exists) and handle loading/error states gracefully — a spinner during "processing" status, retry on failure.

**Your first real task today:** get `api.ts` written against the *documented* contract even before the real backend is live (test against Person 3's stubbed endpoints as soon as they're up), and get navigation flowing between Person 1's screens using mock data. Push to `feat/person4-integration`.

---

## 8. How the 12 days map to this split

| Day | Person 1 (UI) | Person 2 (AI) | Person 3 (Backend/DB) | Person 4 (Integration) |
|---|---|---|---|---|
| 1 | Idea lock-in (all 4 together) — see prior plan |
| 2 | Wireframes + design system | Test OCR/Sarvam/Gemini APIs individually | Supabase project + schema live | Expo project scaffolded, navigation skeleton |
| 3–5 | Build all screens w/ mock data | Build `structure.py`, `ocr.py`, `speech.py`, `insights.py` independently | Build all 5 endpoints with stubbed AI | Build `api.ts`, wire it to Person 3's stubbed endpoints |
| 6–7 | Polish screens as real data starts flowing | Swap real AI functions into Person 3's endpoints | Replace stubs with Person 2's real functions | Swap `mockApi` → `api` in every screen, test end-to-end |
| 8–9 | Handle empty/error states in UI | Handle bad OCR/no-speech-detected gracefully | Handle upload failures, retries | Test the full flow with real, messy data |
| 10 | Visual polish, loading states, icons | Tune prompts for better structured output/insights | — | — |
| 11–12 | PPT + demo prep (all 4 together) — see prior plan |

The key rule: **by end of Day 7, one real photo → OCR → structured data → insights → dashboard must work end-to-end**, even if every screen isn't pixel-perfect yet.
