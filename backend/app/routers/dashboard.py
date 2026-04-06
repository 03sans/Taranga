from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.screening import Screening
from app.models.prediction import PredictionResult
from app.models.progress import StudentProgress

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Threshold above which a score is considered "flagged"
FLAG_THRESHOLD = 60.0


def _get_flag(prediction: PredictionResult | None) -> str:
    """Return 'action', 'review', or 'ok' based on prediction scores."""
    if prediction is None:
        return "ok"
    high = max(
        prediction.dyslexia_score,
        prediction.dyscalculia_score,
        prediction.dysgraphia_score,
        prediction.nvld_score,
        prediction.apd_score,
    )
    if high >= FLAG_THRESHOLD:
        return "action"
    if high >= 35:
        return "review"
    return "ok"


@router.get("/stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return summary counts for the teacher/parent dashboard header cards."""
    now = datetime.utcnow()
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # Students belonging to this teacher / parent
    if current_user.role == "admin":
        students_q = db.query(Student)
    elif current_user.role == "teacher":
        students_q = db.query(Student).filter(Student.teacher_id == current_user.id)
    elif current_user.role == "parent":
        students_q = db.query(Student).filter(Student.parent_id == current_user.id)
    else:
        students_q = db.query(Student).filter(Student.user_id == current_user.id)

    student_ids = [s.id for s in students_q.all()]
    total_students = len(student_ids)

    # Screenings this month (for the teacher's students)
    screenings_this_month = (
        db.query(Screening)
        .filter(
            Screening.student_id.in_(student_ids),
            Screening.created_at >= month_start,
        )
        .count()
        if student_ids
        else 0
    )

    # Flagged students (any prediction score >= threshold)
    flagged = 0
    if student_ids:
        latest_screenings = (
            db.query(Screening)
            .filter(Screening.student_id.in_(student_ids))
            .order_by(Screening.created_at.desc())
            .all()
        )
        seen_students = set()
        for s in latest_screenings:
            if s.student_id in seen_students:
                continue
            seen_students.add(s.student_id)
            pred = db.query(PredictionResult).filter(
                PredictionResult.screening_id == s.id
            ).first()
            if _get_flag(pred) == "action":
                flagged += 1

    # Interventions active = distinct students who have progress logs
    active_interventions = (
        db.query(func.count(func.distinct(StudentProgress.student_id)))
        .filter(StudentProgress.student_id.in_(student_ids))
        .scalar()
        if student_ids
        else 0
    )

    return {
        "total_students": total_students,
        "screenings_this_month": screenings_this_month,
        "flagged_students": flagged,
        "active_interventions": active_interventions or 0,
    }


@router.get("/recent-screenings")
def get_recent_screenings(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return the most recent screenings for the teacher's students, with status flags."""
    if current_user.role == "admin":
        students_q = db.query(Student)
    elif current_user.role == "teacher":
        students_q = db.query(Student).filter(Student.teacher_id == current_user.id)
    elif current_user.role == "parent":
        students_q = db.query(Student).filter(Student.parent_id == current_user.id)
    else:
        return []

    student_map = {s.id: s for s in students_q.all()}
    student_ids = list(student_map.keys())

    if not student_ids:
        return []

    # Get the most recent screening per student
    recent = (
        db.query(Screening)
        .filter(Screening.student_id.in_(student_ids))
        .order_by(Screening.created_at.desc())
        .limit(limit)
        .all()
    )

    results = []
    for screening in recent:
        student = student_map.get(screening.student_id)
        pred = db.query(PredictionResult).filter(
            PredictionResult.screening_id == screening.id
        ).first()
        flag = _get_flag(pred)

        results.append({
            "screening_id": screening.id,
            "student_id": screening.student_id,
            "student_name": student.full_name if student else "Unknown",
            "grade": student.grade if student else "—",
            "date": screening.created_at.strftime("%b %-d, %Y"),
            "flag": flag,
        })

    return results
