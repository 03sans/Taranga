from datetime import datetime
from pydantic import BaseModel

class ProgressCreate(BaseModel):
    student_id: int
    activity_key: str
    score: float
    time_taken_seconds: int

class ProgressOut(BaseModel):
    id: int
    student_id: int
    activity_key: str
    score: float
    time_taken_seconds: int
    attempt_number: int
    completed_at: datetime

    class Config:
        from_attributes = True
