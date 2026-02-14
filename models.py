from sqlmodel import SQLModel, Field
from datetime import datetime
from typing import Optional, List


class DiningEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: datetime
    location: str
    participants: List[str]  # List of participants
    cost_total: float
    rating: int
    tags: List[str]  # List of tags
    notes: str
    image_path: Optional[str] = None  # Path to uploaded image