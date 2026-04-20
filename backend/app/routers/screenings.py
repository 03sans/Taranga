from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.deps import get_db, require_role, get_current_user
from app.models.screening import Screening
from app.models.prediction import PredictionResult
from app.models.student import Student
from app.models.user import User
from app.schemas.screening import ScreeningCreate, NLPObservationCreate, ScreeningOut, PredictionOut
from app.ai.adaptive_engine import create_session, get_session, delete_session
from app.ai.explainer import predict_with_explanation
from app.ai.nlp_analyzer import analyze_observation_notes

router = APIRouter(prefix="/screenings", tags=["Screenings"])


# ═══════════════════════════════════════════════════════════════════════════
# ADAPTIVE SESSION ENDPOINTS
# ═══════════════════════════════════════════════════════════════════════════

class StartSessionRequest(BaseModel):
    student_id: int

class AnswerRequest(BaseModel):
    session_id: str
    question_id: str
    score: int          # 1–5

class CompleteRequest(BaseModel):
    session_id: str
    student_id: int     # redundant safety check


@router.post("/session/start")
def start_session(
    payload: StartSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "parent", "admin")),
):
    """
    Begin a new adaptive screening session.
    Returns the first (gateway) question and a session_id to track progress.
    """
    # Verify student exists and belongs to this teacher
    student = db.query(Student).filter(Student.id == payload.student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student.")

    session = create_session(
        student_id=payload.student_id,
        student_name=student.full_name,
    )
    first_q = session.next_question()

    return {
        "session_id": session.session_id,
        "student_name": student.full_name,
        "question": first_q,
        "progress": session.progress(),
    }


@router.post("/session/answer")
def submit_answer(
    payload: AnswerRequest,
    current_user: User = Depends(require_role("teacher", "parent", "admin")),
):
    """
    Submit an answer to the current question.
    Returns the next question (or null if 20 questions are done).
    """
    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    # Validate score range
    if not (1 <= payload.score <= 5):
        raise HTTPException(status_code=422, detail="Score must be between 1 and 5.")

    # Record the answer
    session.record_answer(payload.question_id, payload.score)

    # Get next question
    next_q = session.next_question()

    return {
        "session_id": payload.session_id,
        "question":   next_q,           # None when complete
        "complete":   session.is_complete(),
        "progress":   session.progress(),
    }


@router.get("/session/{session_id}")
def get_session_state(
    session_id: str,
    current_user: User = Depends(require_role("teacher", "parent", "admin")),
):
    """Return current session state (for page refresh recovery)."""
    session = get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")
    return {
        "session_id":  session_id,
        "complete":    session.is_complete(),
        "progress":    session.progress(),
        "answered":    session.current_question_number,
    }


@router.post("/session/complete")
def complete_session(
    payload: CompleteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "parent", "admin")),
):
    """
    Finalize a screening session:
      1. Pull the feature vector from the session.
      2. Run the ML model + SHAP explainer.
      3. Save Screening + PredictionResult to the database.
      4. Return the full report.
    """
    session = get_session(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found or expired.")

    if not session.is_complete():
        raise HTTPException(
            status_code=400,
            detail=f"Session is not complete — only {session.current_question_number}/20 questions answered."
        )

    feature_vector = session.get_feature_vector()
    routing_summary = session.get_routing_summary()

    # ── Run AI prediction ─────────────────────────────────────────────────
    ai_result = predict_with_explanation(feature_vector)

    if "error" in ai_result:
        raise HTTPException(status_code=500, detail=ai_result["error"])

    scores     = ai_result["scores"]        # {ld: probability}
    explanations = ai_result["explanations"]  # {ld: {probability, top_factors, narrative}}

    # ── Save to database ──────────────────────────────────────────────────
    screening = Screening(
        student_id=payload.student_id,
        assessor_id=current_user.id,
        answers={
            "feature_vector":   feature_vector,
            "raw_answers":      session.answers,
            "routing_summary":  routing_summary,
        },
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)

    prediction = PredictionResult(
        screening_id=screening.id,
        dyslexia_score=round(scores["dyslexia"] * 100, 2),
        dyscalculia_score=round(scores["dyscalculia"] * 100, 2),
        dysgraphia_score=round(scores["dysgraphia"] * 100, 2),
        nvld_score=round(scores["nvld"] * 100, 2),
        apd_score=round(scores["apd"] * 100, 2),
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)

    # ── Clean up session ──────────────────────────────────────────────────
    delete_session(payload.session_id)

    # ── Return full report ─────────────────────────────────────────────────
    return {
        "screening_id": screening.id,
        "student_id":   payload.student_id,
        "student_name": session.student_name,
        "scores": {
            ld: round(p * 100, 1)
            for ld, p in scores.items()
        },
        "explanations": explanations,
        "routing_summary": routing_summary,
        "feature_vector": feature_vector,
    }


# ═══════════════════════════════════════════════════════════════════════════
# LEGACY / NLP ENDPOINTS (preserved)
# ═══════════════════════════════════════════════════════════════════════════

@router.post("/nlp")
def submit_nlp_observation(
    payload: NLPObservationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("teacher", "parent")),
):
    screening = Screening(
        student_id=payload.student_id,
        assessor_id=current_user.id,
        nlp_notes=payload.notes,
    )
    db.add(screening)
    db.commit()
    db.refresh(screening)

    nlp_result = analyze_observation_notes(payload.notes)
    
    prediction = PredictionResult(
        screening_id=screening.id,
        dyslexia_score=85.0 if nlp_result["flag_counts"]["dyslexia"] > 0 else 0.0,
        dyscalculia_score=85.0 if nlp_result["flag_counts"]["dyscalculia"] > 0 else 0.0,
        dysgraphia_score=85.0 if nlp_result["flag_counts"]["dysgraphia"] > 0 else 0.0,
        nvld_score=85.0 if nlp_result["flag_counts"]["nvld"] > 0 else 0.0,
        apd_score=85.0 if nlp_result["flag_counts"]["apd"] > 0 else 0.0,
    )
    db.add(prediction)
    db.commit()
    db.refresh(prediction)
    result = {
        "id": screening.id,
        "student_id": screening.student_id,
        "assessor_id": screening.assessor_id,
        "nlp_notes": screening.nlp_notes,
        "created_at": screening.created_at.isoformat(),
        "_nlp_analysis": nlp_result
    }
    return result


@router.get("/results/{student_id}")
def get_screening_results(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    screenings = db.query(Screening).filter(Screening.student_id == student_id).all()
    predictions = (
        db.query(PredictionResult)
        .join(Screening)
        .filter(Screening.student_id == student_id)
        .order_by(Screening.created_at.desc())
        .all()
    )

    latest = predictions[0] if predictions else None

    latest_pred_dict = None
    if latest:
        latest_pred_dict = {
            "screening_id":    latest.screening_id,
            "dyslexia_score":  latest.dyslexia_score,
            "dyscalculia_score": latest.dyscalculia_score,
            "dysgraphia_score":  latest.dysgraphia_score,
            "nvld_score":        latest.nvld_score,
            "apd_score":         latest.apd_score,
            "created_at":        latest.screening.created_at.isoformat(),
        }

    return {
        "status":           "success",
        "student_id":       student_id,
        "screenings_count": len(screenings),
        "latest_prediction": latest_pred_dict,
        "all_predictions": [
            {
                "screening_id":    p.screening_id,
                "dyslexia_score":  p.dyslexia_score,
                "dyscalculia_score": p.dyscalculia_score,
                "dysgraphia_score":  p.dysgraphia_score,
                "nvld_score":        p.nvld_score,
                "apd_score":         p.apd_score,
                "created_at":        p.screening.created_at.isoformat(),
            }
            for p in predictions
        ],
    }
