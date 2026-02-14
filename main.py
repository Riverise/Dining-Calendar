from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from sqlmodel import create_engine, Session, SQLModel
from models import DiningEvent, DiningEventUpdate
from datetime import datetime
import shutil
import os

def _ensure_new_columns(engine):
    """Add new columns to existing SQLite DB if they are missing."""
    with engine.connect() as conn:
        existing_columns = {row[1] for row in conn.exec_driver_sql("PRAGMA table_info(diningevent)")}
        if "category" not in existing_columns:
            conn.exec_driver_sql("ALTER TABLE diningevent ADD COLUMN category TEXT")
        if "end_datetime" not in existing_columns:
            conn.exec_driver_sql("ALTER TABLE diningevent ADD COLUMN end_datetime DATETIME")

# Create database engine
engine = create_engine("sqlite:///database.db", echo=True)

# Create tables and backfill new columns if DB already exists
SQLModel.metadata.create_all(engine)
_ensure_new_columns(engine)

app = FastAPI(title="Dining Calendar Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount uploads directory
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/events", response_model=list[DiningEvent])
def get_events():
    with Session(engine) as session:
        events = session.query(DiningEvent).all()
        for event in events:
            event.participants = event.participants or []
            event.tags = event.tags or []
        return events

@app.post("/events", response_model=DiningEvent)
def create_event(event_data: dict):
    """Accept raw JSON and coerce date strings into datetime objects before creating the model.

    Returns a 400 with a helpful message if parsing fails.
    """
    def _parse_iso(val):
        if val is None or val == '':
            return None
        if isinstance(val, datetime):
            return val
        if isinstance(val, (int, float)):
            # assume timestamp
            try:
                return datetime.fromtimestamp(val)
            except Exception:
                pass
        if isinstance(val, str):
            try:
                # support trailing Z
                return datetime.fromisoformat(val.replace('Z', '+00:00'))
            except Exception:
                # try a few common formats
                from datetime import datetime as _dt
                patterns = [
                    "%Y-%m-%dT%H:%M:%S%z",
                    "%Y-%m-%dT%H:%M:%S",
                    "%Y-%m-%dT%H:%M",
                    "%Y-%m-%d",
                ]
                for p in patterns:
                    try:
                        return _dt.strptime(val, p)
                    except Exception:
                        continue
        raise ValueError(f"Could not parse datetime value: {val}")

    try:
        # normalize lists
        participants = event_data.get('participants') or []
        tags = event_data.get('tags') or []
        if isinstance(participants, str):
            participants = [p.strip() for p in participants.split(',') if p.strip()]
        if isinstance(tags, str):
            tags = [t.strip() for t in tags.split(',') if t.strip()]

        parsed = {
            **event_data,
            'date': _parse_iso(event_data.get('date')),
            'end_datetime': _parse_iso(event_data.get('end_datetime') or event_data.get('endDate')),
            'participants': participants,
            'tags': tags,
        }

        event = DiningEvent(**parsed)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Invalid input: {exc}")

    with Session(engine) as session:
        session.add(event)
        session.commit()
        session.refresh(event)
        # normalize JSON fields for clients
        event.participants = event.participants or []
        event.tags = event.tags or []
        return event

@app.get("/events/{event_id}", response_model=DiningEvent)
def get_event(event_id: int):
    with Session(engine) as session:
        event = session.get(DiningEvent, event_id)
        if event:
            event.participants = event.participants or []
            event.tags = event.tags or []
        return event

@app.put("/events/{event_id}", response_model=DiningEvent)
def update_event(event_id: int, updated_event: DiningEventUpdate):
    with Session(engine) as session:
        event = session.get(DiningEvent, event_id)
        if event:
            update_data = updated_event.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(event, key, value)
            event.participants = event.participants or []
            event.tags = event.tags or []
            session.commit()
            session.refresh(event)
        return event

@app.delete("/events/{event_id}")
def delete_event(event_id: int):
    with Session(engine) as session:
        event = session.get(DiningEvent, event_id)
        if event:
            session.delete(event)
            session.commit()
        return {"message": "Event deleted"}

@app.post("/upload-image")
async def upload_image(file: UploadFile = File(...)):
    file_path = f"{UPLOAD_DIR}/{file.filename}"
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "path": file_path}