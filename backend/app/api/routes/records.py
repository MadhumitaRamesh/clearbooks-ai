from fastapi import APIRouter, UploadFile, File, HTTPException
from datetime import datetime, timezone
import uuid

from app.db.supabase_client import get_supabase
from app.schemas import FullRecordOut, RecordListOut, RecordOut, ExtractedOut, InsightsOut
from app.ai.ocr import ocr_image
from app.ai.speech import transcribe_audio
from app.ai.structure import structure_text
from app.ai.insights import generate_insights

router = APIRouter(prefix="/api/v1/records", tags=["records"])

# TODO(Person 3): replace with the real logged-in owner id once Supabase auth
# is wired up (Person 4 handles the client side of auth). Every query below
# is written to filter by owner_id so swapping this constant out is a one-line change.
FAKE_OWNER_ID = "00000000-0000-0000-0000-000000000000"


def _process_record(record_id: str, source_type: str, raw_bytes: bytes) -> None:
    """
    Shared pipeline for both image and audio uploads:
    OCR/STT -> structure_text -> insert extracted_data
            -> generate_insights -> insert insights
            -> update records.status
    Wrapped so any AI failure marks the record 'failed' instead of crashing.
    """
    supabase = get_supabase()
    try:
        if source_type == "image":
            raw_text = ocr_image(raw_bytes)
        else:
            raw_text = transcribe_audio(raw_bytes)

        structured = structure_text(raw_text)

        supabase.table("extracted_data").insert({
            "record_id": record_id,
            "raw_text": raw_text,
            "structured_json": structured,
        }).execute()

        insights = generate_insights(structured.get("transactions", []))

        supabase.table("insights").insert({
            "record_id": record_id,
            "summary": insights.get("summary", ""),
            "insight_json": insights,
        }).execute()

        supabase.table("records").update({"status": "done"}).eq("id", record_id).execute()

    except Exception as exc:  # noqa: BLE001 - intentionally broad: reliability > features for the demo
        print(f"[records] processing failed for {record_id}: {exc}")
        supabase.table("records").update({"status": "failed"}).eq("id", record_id).execute()


def _fetch_full_record(record_id: str) -> FullRecordOut:
    supabase = get_supabase()

    record_res = supabase.table("records").select("*").eq("id", record_id).single().execute()
    if not record_res.data:
        raise HTTPException(status_code=404, detail="Record not found")
    record = record_res.data

    extracted_res = supabase.table("extracted_data").select("*").eq("record_id", record_id).execute()
    extracted = None
    if extracted_res.data:
        row = extracted_res.data[0]
        extracted = ExtractedOut(raw_text=row["raw_text"], structured=row["structured_json"])

    insights_res = supabase.table("insights").select("*").eq("record_id", record_id).execute()
    insights = None
    if insights_res.data:
        row = insights_res.data[0]
        insights = InsightsOut(**row["insight_json"])

    return FullRecordOut(
        record=RecordOut(
            id=record["id"],
            status=record["status"],
            source_type=record["source_type"],
            created_at=record["created_at"],
        ),
        extracted=extracted,
        insights=insights,
    )


@router.post("/image", response_model=FullRecordOut)
async def upload_image(file: UploadFile = File(...)):
    contents = await file.read()
    supabase = get_supabase()

    record_id = str(uuid.uuid4())
    file_path = f"{record_id}/{file.filename}"

    # Upload to Supabase Storage (bucket must exist — create a 'records' bucket in the dashboard)
    supabase.storage.from_("records").upload(file_path, contents)
    file_url = supabase.storage.from_("records").get_public_url(file_path)

    supabase.table("records").insert({
        "id": record_id,
        "owner_id": FAKE_OWNER_ID,
        "source_type": "image",
        "file_url": file_url,
        "status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    _process_record(record_id, "image", contents)
    return _fetch_full_record(record_id)


@router.post("/audio", response_model=FullRecordOut)
async def upload_audio(file: UploadFile = File(...)):
    contents = await file.read()
    supabase = get_supabase()

    record_id = str(uuid.uuid4())
    file_path = f"{record_id}/{file.filename}"

    supabase.storage.from_("records").upload(file_path, contents)
    file_url = supabase.storage.from_("records").get_public_url(file_path)

    supabase.table("records").insert({
        "id": record_id,
        "owner_id": FAKE_OWNER_ID,
        "source_type": "audio",
        "file_url": file_url,
        "status": "processing",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }).execute()

    _process_record(record_id, "audio", contents)
    return _fetch_full_record(record_id)


@router.get("/{record_id}", response_model=FullRecordOut)
async def get_record(record_id: str):
    return _fetch_full_record(record_id)


@router.get("", response_model=RecordListOut)
async def list_records():
    supabase = get_supabase()
    res = (
        supabase.table("records")
        .select("*")
        .eq("owner_id", FAKE_OWNER_ID)
        .order("created_at", desc=True)
        .execute()
    )
    records = [
        RecordOut(id=r["id"], status=r["status"], source_type=r["source_type"], created_at=r["created_at"])
        for r in res.data
    ]
    return RecordListOut(records=records)
