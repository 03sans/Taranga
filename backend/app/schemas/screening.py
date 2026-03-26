from datetime import datetime
from pydantic import BaseModel

class ScreeningCreate(BaseModel):
    student_id: int
    answers: dict

class NLPObservationCreate(BaseModel):
    student_id: int
    notes: str

class ScreeningOut(BaseModel):
    id: int
    student_id: int
    assessor_id: int
    answers: dict
    nlp_notes: str | None
    created_at: datetime
    
    class Config:
        from_attributes = True

class PredictionOut(BaseModel):
    id: int
    screening_id: int
    dyslexia_score: float
    dyscalculia_score: float
    dysgraphia_score: float
    nvld_score: float
    apd_score: float
    created_at: datetime
    
    class Config:
        from_attributes = True
