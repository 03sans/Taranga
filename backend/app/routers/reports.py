from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_role, get_current_user
from app.models.student import Student
from app.models.screening import Screening
from app.models.prediction import PredictionResult
from app.models.progress import StudentProgress
from app.models.user import User

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/{student_id}")
def generate_full_report(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
        
    screenings = db.query(Screening).filter(Screening.student_id == student_id).all()
    predictions = db.query(PredictionResult).join(Screening).filter(Screening.student_id == student_id).all()
    progress = db.query(StudentProgress).filter(StudentProgress.student_id == student_id).all()
    
    # Return an aggregated JSON report. The frontend can render this into a PDF.
    return {
        "student": {
            "id": student.id,
            "name": student.full_name,
            "grade": student.grade
        },
        "screenings": [
            {
                "id": s.id,
                "date": s.created_at,
                "assessor_id": s.assessor_id
            } for s in screenings
        ],
        "predictions": [
            {
                "screening_id": p.screening_id,
                "scores": {
                    "dyslexia": p.dyslexia_score,
                    "dyscalculia": p.dyscalculia_score,
                    "dysgraphia": p.dysgraphia_score,
                    "nvld": p.nvld_score,
                    "apd": p.apd_score
                },
                "date": p.created_at
            } for p in predictions
        ],
        "progress": [
            {
                "activity_id": pr.activity_id,
                "score": pr.score,
                "time_taken": pr.time_taken_seconds,
                "date": pr.completed_at
            } for pr in progress
        ]
    }
