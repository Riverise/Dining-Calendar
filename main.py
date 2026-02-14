from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlmodel import create_engine, Session, SQLModel
from models import DiningEvent, DiningEventUpdate
import shutil
import os

# Create database engine
engine = create_engine("sqlite:///database.db", echo=True)

# Create tables
SQLModel.metadata.create_all(engine)

app = FastAPI(title="Dining Calendar Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.get("/events", response_model=list[DiningEvent])
def get_events():
    with Session(engine) as session:
        events = session.query(DiningEvent).all()
        return events

@app.post("/events", response_model=DiningEvent)
def create_event(event: DiningEvent):
    with Session(engine) as session:
        session.add(event)
        session.commit()
        session.refresh(event)
        return event

@app.get("/events/{event_id}", response_model=DiningEvent)
def get_event(event_id: int):
    with Session(engine) as session:
        event = session.get(DiningEvent, event_id)
        return event

@app.put("/events/{event_id}", response_model=DiningEvent)
def update_event(event_id: int, updated_event: DiningEventUpdate):
    with Session(engine) as session:
        event = session.get(DiningEvent, event_id)
        if event:
            update_data = updated_event.dict(exclude_unset=True)
            for key, value in update_data.items():
                setattr(event, key, value)
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