from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.core.deps import get_db, require_role, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.screening import Screening
from app.models.progress import StudentProgress
from app.models.prediction import PredictionResult
from app.schemas.user import UserOut

router = APIRouter(prefix="/users", tags=["Users"])



# ── GET /users/platform-stats ────────────────────────────────────────────────
@router.get("/platform-stats")
def platform_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    total_teachers   = db.query(func.count(User.id)).filter(User.role == "teacher").scalar() or 0
    active_teachers  = db.query(func.count(User.id)).filter(User.role == "teacher", User.is_active == True).scalar() or 0
    total_students   = db.query(func.count(Student.id)).scalar() or 0
    total_screenings = db.query(func.count(Screening.id)).scalar() or 0
    students_active  = db.query(func.count(func.distinct(StudentProgress.student_id))).scalar() or 0

    return {
        "total_teachers": total_teachers,
        "active_teachers": active_teachers,
        "total_students": total_students,
        "total_screenings": total_screenings,
        "students_with_interventions": students_active,
    }


# ── GET /users/analytics ──────────────────────────────────────────────────────
@router.get("/analytics")
def get_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Role-aware analytics endpoint.
    Admin  → data for all students.
    Teacher → data scoped to their own students only.
    """
    FLAG_THRESHOLD = 60.0
    LD_FIELDS = {
        "Dyslexia":    "dyslexia_score",
        "Dyscalculia": "dyscalculia_score",
        "Dysgraphia":  "dysgraphia_score",
        "NVLD":        "nvld_score",
        "APD":         "apd_score",
    }

    # Determine which student IDs are in scope
    if current_user.role == "admin":
        student_ids = [s.id for s in db.query(Student.id).all()]
    elif current_user.role == "teacher":
        student_ids = [s.id for s in db.query(Student.id).filter(Student.teacher_id == current_user.id).all()]
    elif current_user.role == "parent":
        student_ids = [s.id for s in db.query(Student.id).filter(Student.parent_id == current_user.id).all()]
    elif current_user.role == "student":
        student_ids = [s.id for s in db.query(Student.id).filter(Student.user_id == current_user.id).all()]
    else:
        return {"ld_distribution": [], "recent_activity": [], "summary": {}}

    # Short-circuit if no students found
    if not student_ids:
        return {"ld_distribution": [], "recent_activity": [], "summary": {}}

    # ── LD distribution from prediction_results ──
    total_predictions = (
        db.query(func.count(PredictionResult.id))
        .join(Screening, PredictionResult.screening_id == Screening.id)
        .filter(Screening.student_id.in_(student_ids))
        .scalar() or 0
    )

    ld_distribution = []
    for ld_name, field in LD_FIELDS.items():
        col = getattr(PredictionResult, field)
        flagged = (
            db.query(func.count(PredictionResult.id))
            .join(Screening, PredictionResult.screening_id == Screening.id)
            .filter(Screening.student_id.in_(student_ids), col >= FLAG_THRESHOLD)
            .scalar() or 0
        )
        pct = round((flagged / total_predictions) * 100) if total_predictions > 0 else 0
        ld_distribution.append({"ld": ld_name, "flagged": flagged, "pct": pct})

    # ── Recent activity log (last 20 attempts) ──
    recent_rows = (
        db.query(StudentProgress, Student)
        .join(Student, StudentProgress.student_id == Student.id)
        .filter(StudentProgress.student_id.in_(student_ids))
        .order_by(StudentProgress.completed_at.desc())
        .limit(20)
        .all()
    )

    recent_activity = []
    for prog, stu in recent_rows:
        recent_activity.append({
            "student_name": stu.full_name,
            "activity_key": prog.activity_key,
            "score": round(prog.score),
            "attempt": prog.attempt_number,
            "completed_at": prog.completed_at.isoformat(),
        })

    # ── Summary numbers ──
    total_attempts  = db.query(func.count(StudentProgress.id)).filter(StudentProgress.student_id.in_(student_ids)).scalar() or 0
    avg_score_row   = db.query(func.avg(StudentProgress.score)).filter(StudentProgress.student_id.in_(student_ids)).scalar()
    avg_score       = round(float(avg_score_row)) if avg_score_row else 0
    students_active = db.query(func.count(func.distinct(StudentProgress.student_id))).filter(StudentProgress.student_id.in_(student_ids)).scalar() or 0

    return {
        "ld_distribution": ld_distribution,
        "recent_activity":  recent_activity,
        "summary": {
            "total_attempts":  total_attempts,
            "avg_score":       avg_score,
            "students_active": students_active,
            "total_screenings": db.query(func.count(Screening.id)).filter(Screening.student_id.in_(student_ids)).scalar() or 0,
        },
    }


# ── GET /users/teachers ──────────────────────────────────────────────────────
@router.get("/teachers")
def list_teachers(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    teachers = db.query(User).filter(User.role == "teacher").order_by(User.full_name).all()
    result = []
    for t in teachers:
        student_count = db.query(func.count(Student.id)).filter(Student.teacher_id == t.id).scalar() or 0
        screening_count = (
            db.query(func.count(Screening.id))
            .join(Student, Screening.student_id == Student.id)
            .filter(Student.teacher_id == t.id)
            .scalar() or 0
        )
        result.append({
            "id": t.id,
            "full_name": t.full_name,
            "email": t.email,
            "is_active": t.is_active,
            "student_count": student_count,
            "screening_count": screening_count,
        })
    return result


# ── GET /users/  (admin only) ──────────────────────────────────────────────
@router.get("", response_model=list[UserOut])
def list_users(
    skip: int = 0, limit: int = 200,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    return db.query(User).offset(skip).limit(limit).all()


# ── POST /users/{user_id}/activate ──────────────────────────────────────────
@router.post("/{user_id}/activate")
def activate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = True
    db.commit()
    return {"status": "activated", "user_id": user_id}


# ── POST /users/{user_id}/deactivate ────────────────────────────────────────
@router.post("/{user_id}/deactivate")
def deactivate_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot deactivate your own account.")
    user.is_active = False
    db.commit()
    return {"status": "deactivated", "user_id": user_id}


# ── DELETE /users/{user_id} ──────────────────────────────────────────────────
@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin"))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot delete your own account.")
        
    # Unlink student record to avoid foreign key constraints
    if user.role == "student":
        student = db.query(Student).filter(Student.user_id == user.id).first()
        if student:
            student.user_id = None
            
    db.delete(user)
    db.commit()
    return {"status": "deleted", "user_id": user_id}


# ── GET /users/{user_id} ────────────────────────────────────────────────────
@router.get("/{user_id}", response_model=UserOut)
def get_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if current_user.role != "admin" and current_user.id != user_id:
        raise HTTPException(status_code=403, detail="Not permitted")
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
