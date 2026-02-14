# Dining Calendar Backend

A FastAPI backend for managing dining events using SQLModel and SQLite.

## Installation

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn main:app --reload
   ```

## API Endpoints

- GET /events: Get all dining events
- POST /events: Create a new dining event
- GET /events/{event_id}: Get a specific event
- PUT /events/{event_id}: Update an event
- DELETE /events/{event_id}: Delete an event
- POST /upload-image: Upload an image file

## Model

DiningEvent:
- id: Integer (primary key)
- title: String
- date: DateTime
- location: String
- participants: List of Strings
- cost_total: Float
- rating: Integer (1-5)
- tags: List of Strings
- notes: String
- image_path: Optional String (path to uploaded image)