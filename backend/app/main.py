from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes import records, dashboard

app = FastAPI(title="ClearBooks AI - Backend")

# Wide-open CORS for the hackathon; tighten before any real deploy.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(records.router)
app.include_router(dashboard.router)


@app.get("/")
async def root():
    return {"status": "ok", "service": "clearbooks-ai backend"}
