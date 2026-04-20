from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_role, get_current_user
from app.models.progress import StudentProgress
from app.models.activity import InterventionActivity
from app.models.user import User
from app.schemas.progress import ProgressCreate, ProgressOut

router = APIRouter(prefix="/progress", tags=["Progress"])

@router.post("/", response_model=ProgressOut)
def log_progress(
    payload: ProgressCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    progress = StudentProgress(
        student_id=payload.student_id,
        activity_key=payload.activity_key,
        score=payload.score,
        time_taken_seconds=payload.time_taken_seconds
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)
    return progress

@router.get("/{student_id}", response_model=list[ProgressOut])
def get_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Depending on role, we might want to restrict access like we did in get_student
    progress_records = db.query(StudentProgress).filter(StudentProgress.student_id == student_id).all()
    return progress_records
