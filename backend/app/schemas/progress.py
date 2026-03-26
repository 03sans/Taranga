from datetime import datetime
from pydantic import BaseModel

class ProgressCreate(BaseModel):
    student_id: int
    activity_id: int
    score: float
    time_taken_seconds: int

class ProgressOut(BaseModel):
    id: int
    student_id: int
    activity_id: int
    score: float
    time_taken_seconds: int
    completed_at: datetime
    
    class Config:
        from_attributes = True
