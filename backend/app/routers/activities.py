"""
Activities router — handles the catalog, assignment, attempt submission,
and student progress summary.
"""
from datetime import date
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.student import Student
from app.models.assignment import StudentActivityAssignment
from app.models.progress import StudentProgress
from app.ai.activity_catalog import ACTIVITIES, ACTIVITY_BY_KEY, ACTIVITIES_BY_LD

router = APIRouter(prefix="/activities", tags=["activities"])


# ── schemas ────────────────────────────────────────────────────────────────

class AssignRequest(BaseModel):
    student_id: int
    activity_keys: List[str]


class AttemptRequest(BaseModel):
    score: float          # 0–100
    time_taken_seconds: int


class AttemptOut(BaseModel):
    activity_key: str
    score: float
    time_taken_seconds: int
    attempt_number: int
    xp_earned: int


# ── helpers ────────────────────────────────────────────────────────────────

def _assert_teacher(current_user: User):
    if current_user.role not in ("teacher", "admin"):
        raise HTTPException(status_code=403, detail="Teachers only.")


def _get_student_for_teacher(student_id: int, teacher: User, db: Session) -> Student:
    student = db.get(Student, student_id)
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if teacher.role != "admin" and student.teacher_id != teacher.id:
        raise HTTPException(status_code=403, detail="Not your student.")
    return student


def _get_student_for_current_user(current_user: User, db: Session) -> Student:
    """When a student is logged in, find their Student record via user_id."""
    student = db.query(Student).filter(Student.user_id == current_user.id).first()
    if not student:
        raise HTTPException(status_code=404, detail="No student profile linked to this account.")
    return student


# ── endpoints ──────────────────────────────────────────────────────────────

@router.get("/catalog")
def get_catalog(
    ld_type: str | None = None,
    current_user: User = Depends(get_current_user),
):
    """Return all activities (optionally filtered by LD type). Teacher use."""
    if ld_type:
        return ACTIVITIES_BY_LD.get(ld_type, [])
    return ACTIVITIES


@router.post("/assign")
def assign_activities(
    req: AssignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Teacher assigns one or more activity keys to a student."""
    _assert_teacher(current_user)
    student = _get_student_for_teacher(req.student_id, current_user, db)

    # Validate keys
    for key in req.activity_keys:
        if key not in ACTIVITY_BY_KEY:
            raise HTTPException(status_code=400, detail=f"Unknown activity key: {key}")

    assigned = []
    for key in req.activity_keys:
        existing = db.query(StudentActivityAssignment).filter(
            StudentActivityAssignment.student_id == student.id,
            StudentActivityAssignment.activity_key == key,
            StudentActivityAssignment.is_active == True,
        ).first()
        if not existing:
            assignment = StudentActivityAssignment(
                student_id=student.id,
                activity_key=key,
                assigned_by=current_user.id,
            )
            db.add(assignment)
            assigned.append(key)

    db.commit()
    return {"assigned": assigned, "already_assigned": [k for k in req.activity_keys if k not in assigned]}


@router.delete("/assign/{student_id}/{activity_key}")
def revoke_assignment(
    student_id: int,
    activity_key: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Teacher un-assigns an activity."""
    _assert_teacher(current_user)
    _get_student_for_teacher(student_id, current_user, db)

    row = db.query(StudentActivityAssignment).filter(
        StudentActivityAssignment.student_id == student_id,
        StudentActivityAssignment.activity_key == activity_key,
        StudentActivityAssignment.is_active == True,
    ).first()
    if row:
        row.is_active = False
        db.commit()
    return {"detail": "Activity un-assigned."}


@router.get("/my")
def get_my_activities(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Student-facing: return all activities for their LD(s), with
    assigned/locked status and best score per activity.
    """
    student = _get_student_for_current_user(current_user, db)

    # Get assigned activity keys for this student
    assignments = db.query(StudentActivityAssignment).filter(
        StudentActivityAssignment.student_id == student.id,
        StudentActivityAssignment.is_active == True,
    ).all()
    assigned_keys = {a.activity_key for a in assignments}

    # Get best score per activity
    best_scores = {}
    attempt_counts = {}
    rows = db.query(
        StudentProgress.activity_key,
        func.max(StudentProgress.score).label("best"),
        func.count(StudentProgress.id).label("attempts"),
    ).filter(StudentProgress.student_id == student.id).group_by(StudentProgress.activity_key).all()
    for r in rows:
        best_scores[r.activity_key] = r.best
        attempt_counts[r.activity_key] = r.attempts

    # Return all activities (all LDs) with status
    result = []
    for act in ACTIVITIES:
        key = act["key"]
        is_assigned = key in assigned_keys
        best = best_scores.get(key)
        result.append({
            **act,
            "status": "assigned" if is_assigned else "locked",
            "best_score": best,
            "attempts": attempt_counts.get(key, 0),
            "completed": best is not None,
        })
    return result


@router.post("/{activity_key}/attempt", response_model=AttemptOut)
def submit_attempt(
    activity_key: str,
    req: AttemptRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student submits a completed activity attempt."""
    if activity_key not in ACTIVITY_BY_KEY:
        raise HTTPException(status_code=404, detail="Activity not found.")

    student = _get_student_for_current_user(current_user, db)

    # Check it's assigned
    assignment = db.query(StudentActivityAssignment).filter(
        StudentActivityAssignment.student_id == student.id,
        StudentActivityAssignment.activity_key == activity_key,
        StudentActivityAssignment.is_active == True,
    ).first()
    if not assignment:
        raise HTTPException(status_code=403, detail="This activity has not been assigned to you.")

    # Count existing attempts
    prev_count = db.query(func.count(StudentProgress.id)).filter(
        StudentProgress.student_id == student.id,
        StudentProgress.activity_key == activity_key,
    ).scalar() or 0

    score = max(0.0, min(100.0, req.score))
    progress = StudentProgress(
        student_id=student.id,
        activity_key=activity_key,
        score=score,
        time_taken_seconds=req.time_taken_seconds,
        attempt_number=prev_count + 1,
    )
    db.add(progress)
    db.commit()
    db.refresh(progress)

    act_meta = ACTIVITY_BY_KEY[activity_key]
    xp_earned = int(act_meta["xp"] * (score / 100))

    return AttemptOut(
        activity_key=activity_key,
        score=score,
        time_taken_seconds=req.time_taken_seconds,
        attempt_number=progress.attempt_number,
        xp_earned=xp_earned,
    )


@router.get("/progress/summary")
def get_progress_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Student dashboard summary: XP, completed count, streak, level."""
    student = _get_student_for_current_user(current_user, db)

    rows = db.query(StudentProgress).filter(
        StudentProgress.student_id == student.id
    ).all()

    total_xp = 0
    completed_keys = set()
    for r in rows:
        act = ACTIVITY_BY_KEY.get(r.activity_key)
        if act:
            total_xp += int(act["xp"] * (r.score / 100))
        if r.score >= 60:
            completed_keys.add(r.activity_key)

    level = 1 + total_xp // 200  # level up every 200 XP

    # Simple streak: count distinct days with at least one attempt (last 30 days)
    from datetime import timedelta, date as date_type
    from sqlalchemy import cast, Date as SADate
    recent = db.query(
        func.count(func.distinct(cast(StudentProgress.completed_at, SADate)))
    ).filter(
        StudentProgress.student_id == student.id,
    ).scalar() or 0

    return {
        "total_xp": total_xp,
        "level": level,
        "xp_to_next_level": 200 - (total_xp % 200),
        "completed_count": len(completed_keys),
        "total_attempts": len(rows),
        "streak_days": min(recent, 30),
    }
