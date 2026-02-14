from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from datetime import datetime
from typing import Optional, List


class DiningEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: datetime
    location: str
    participants: List[str] = Field(sa_column=Column(JSON))  # List of participants
    cost_total: float
    rating: int
    tags: List[str] = Field(sa_column=Column(JSON))  # List of tags
    notes: str
    image_path: Optional[str] = None  # Path to uploaded image


class DiningEventUpdate(SQLModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    location: Optional[str] = None
    participants: Optional[List[str]] = None
    cost_total: Optional[float] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    image_path: Optional[str] = None