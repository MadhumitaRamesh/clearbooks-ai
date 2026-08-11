# backend/app/ai — Person 2

Four standalone functions, matching the contract exactly:

| File | Function | Used for |
|---|---|---|
| `structure.py` | `structure_text(raw_text: str) -> dict` | raw text → transactions JSON (Gemini) |
| `insights.py` | `generate_insights(transactions: list[dict]) -> dict` | transactions → insights JSON (Gemini) |
| `ocr.py` | `ocr_image(image_bytes: bytes) -> str` | photo → raw text (Google Cloud Vision) |
| `speech.py` | `transcribe_audio(audio_bytes: bytes) -> str` | voice note → raw text (Sarvam AI) |

Person 3 imports these four functions directly into the FastAPI routes — signatures
must stay exactly as above so nothing needs renegotiating.

## Setup

```bash
pip install -r requirements.txt
```

Set these env vars (put them in a `.env` you don't commit, or export in your shell):

```bash
export GEMINI_API_KEY="..."
export SARVAM_API_KEY="..."
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account.json"
```

- **Gemini key**: https://aistudio.google.com/apikey
- **Sarvam key**: Sarvam AI dashboard → API keys
- **Google Vision**: create a service account in Google Cloud Console with the
  "Cloud Vision API User" role, download its JSON key, point
  `GOOGLE_APPLICATION_CREDENTIALS` at the file path. Also enable the Vision API
  on the project.

## Test order (matches the plan — start with what needs no external files)

```bash
# 1. structure.py — works immediately with fake raw text, no files needed
python structure.py

# 2. ocr.py — needs one sample photo of a handwritten/printed record
python ocr.py sample_receipt.jpg

# 3. speech.py — needs one sample voice note
python speech.py sample_voice.wav

# 4. insights.py — works immediately with fake transactions, no files needed
python insights.py
```

Each script also accepts an optional file argument to test with your own data
(`structure.py sample.txt`, `insights.py sample.json`).

## Notes / gotchas

- All four functions raise on missing API keys / API errors rather than failing
  silently — Person 3's routes catch exceptions and set `status='failed'` per
  the contract, so raising is the correct behavior here, don't swallow errors.
- `structure_text` and `generate_insights` both defensively normalize Gemini's
  JSON output (coercing types, filling missing fields) so a slightly-off model
  response can't crash the FastAPI route downstream.
- `ocr_image` uses `document_text_detection` (not plain `text_detection`) —
  better suited to dense handwritten ledger pages than the simpler endpoint.
- `transcribe_audio` uses Sarvam's synchronous REST endpoint, good for audio
  under ~30s. If voice notes run longer, swap to Sarvam's Batch API (same auth
  header, different endpoint) without changing the function signature.
- Nothing here imports FastAPI or touches the web layer — exactly as scoped,
  these are plain Python functions Person 3 imports later.
