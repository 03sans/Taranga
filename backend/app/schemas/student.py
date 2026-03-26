from datetime import date, datetime
from pydantic import BaseModel

class StudentCreate(BaseModel):
    full_name: str
    date_of_birth: date | None = None
    grade: str | None = None
    user_id: int | None = None

class StudentOut(BaseModel):
    id: int
    full_name: str
    date_of_birth: date | None
    grade: str | None
    teacher_id: int
    parent_id: int | None
    user_id: int | None
    created_at: datetime

    class Config:
        from_attributes = True