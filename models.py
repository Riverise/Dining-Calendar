from sqlmodel import SQLModel, Field
from sqlalchemy import Column, JSON
from datetime import datetime
from typing import Optional, List
from pydantic import field_validator


class DiningEvent(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    title: str
    date: datetime  # event start datetime
    end_datetime: Optional[datetime] = None
    location: str
    category: Optional[str] = None
    participants: List[str] = Field(default_factory=list, sa_column=Column(JSON))  # List of participants
    cost_total: float
    rating: int
    tags: List[str] = Field(default_factory=list, sa_column=Column(JSON))  # List of tags
    notes: str
    image_path: Optional[str] = None  # Path to uploaded image

    @field_validator('date', 'end_datetime', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError(f"Invalid datetime format: {v}")
        return v


class DiningEventUpdate(SQLModel):
    title: Optional[str] = None
    date: Optional[datetime] = None
    end_datetime: Optional[datetime] = None
    location: Optional[str] = None
    category: Optional[str] = None
    participants: Optional[List[str]] = None
    cost_total: Optional[float] = None
    rating: Optional[int] = None
    tags: Optional[List[str]] = None
    notes: Optional[str] = None
    image_path: Optional[str] = None

    @field_validator('date', 'end_datetime', mode='before')
    @classmethod
    def parse_datetime(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                raise ValueError(f"Invalid datetime format: {v}")
        return v