from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_role, get_current_user
from app.models.screening import Screening
from app.models.prediction import PredictionResult
from app.models.user import User
from app.schemas.screening import ScreeningCreate, NLPObservationCreate, ScreeningOut, PredictionOut

router = APIRouter(prefix="/screenings", tags=["Screenings"])

@router.post("/adaptive", response_model=ScreeningOut)
def submit_questionnaire(
    payload: ScreeningCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "parent"))
):
    # Depending on logic, create a new screening or update an existing one without NLP notes
    screening = Screening(
        student_id=payload.student_id,
        assessor_id=current_user.id,
        answers=payload.answers
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)
    
    # Ideally, trigger ML models here. For now, we return the saved row.
    return screening

@router.post("/nlp", response_model=ScreeningOut)
def submit_nlp_observation(
    payload: NLPObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "parent"))
):
    # We might append to an existing screening or create a new one. Let's create a new one for simplicity.
    screening = Screening(
        student_id=payload.student_id,
        assessor_id=current_user.id,
        nlp_notes=payload.notes
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)
    
    # Trigger NLP pipeline here
    return screening

@router.get("/results/{student_id}")
def get_screening_results(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Fetch all screenings
    screenings = db.query(Screening).filter(Screening.student_id == student_id).all()
    # Fetch predictions
    predictions = db.query(PredictionResult).join(Screening).filter(Screening.student_id == student_id).all()
    
    return {
        "status": "success",
        "student_id": student_id,
        "screenings_count": len(screenings),
        "predictions": predictions
    }
