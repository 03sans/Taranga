from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from app.core.deps import get_db, require_role, get_current_user
from app.core.security import hash_password
from app.models.student import Student
from app.models.user import User
from app.models.screening import Screening
from app.models.prediction import PredictionResult
from app.schemas.student import StudentCreate, StudentOut
from app.schemas.user import StudentAccountCreate

router = APIRouter(prefix="/students", tags=["Students"])

FLAG_THRESHOLD = 60.0
LD_NAMES = ["dyslexia", "dyscalculia", "dysgraphia", "nvld", "apd"]
LD_DISPLAY = {
    "dyslexia":    "Dyslexia",
    "dyscalculia": "Dyscalculia",
    "dysgraphia":  "Dysgraphia",
    "nvld":        "NVLD",
    "apd":         "APD",
}


def _build_rich(student: Student, db: Session) -> dict:
    """Return a student dict enriched with teacher name, LD flags, and last screening date."""
    # Teacher name
    teacher = db.query(User).filter(User.id == student.teacher_id).first()
    teacher_name = teacher.full_name if teacher else "—"

    # Latest screening for this student
    latest_screening = (
        db.query(Screening)
        .filter(Screening.student_id == student.id)
        .order_by(desc(Screening.created_at))
        .first()
    )

    last_date = (
        latest_screening.created_at.strftime("%-d %b %Y") if latest_screening else None
    )

    # LD flags from the latest prediction
    ld_flags: list[str] = []
    if latest_screening:
        pred = (
            db.query(PredictionResult)
            .filter(PredictionResult.screening_id == latest_screening.id)
            .first()
        )
        if pred:
            scores = {
                "dyslexia":    pred.dyslexia_score,
                "dyscalculia": pred.dyscalculia_score,
                "dysgraphia":  pred.dysgraphia_score,
                "nvld":        pred.nvld_score,
                "apd":         pred.apd_score,
            }
            ld_flags = [LD_DISPLAY[k] for k, v in scores.items() if v >= FLAG_THRESHOLD]

    return {
        "id":            student.id,
        "full_name":     student.full_name,
        "grade":         student.grade or "—",
        "teacher_name":  teacher_name,
        "teacher_id":    student.teacher_id,
        "ld_flags":      ld_flags,
        "last_screening": last_date,
        "created_at":    student.created_at.isoformat(),
    }


# ── GET /students/rich ──────────────────────────────────────────────────────
@router.get("/rich")
def list_students_rich(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Return all students the current user can see, enriched with teacher name + LD flags."""
    if current_user.role == "admin":
        students = db.query(Student).order_by(Student.full_name).all()
    elif current_user.role == "teacher":
        students = (
            db.query(Student)
            .filter(Student.teacher_id == current_user.id)
            .order_by(Student.full_name)
            .all()
        )
    elif current_user.role == "parent":
        students = (
            db.query(Student)
            .filter(Student.parent_id == current_user.id)
            .order_by(Student.full_name)
            .all()
        )
    else:
        return []

    return [_build_rich(s, db) for s in students]


# ── POST /students/ ──────────────────────────────────────────────────────────
@router.post("", response_model=StudentOut)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    student = Student(
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        grade=payload.grade,
        teacher_id=current_user.id,   # always the logged-in teacher
        user_id=payload.user_id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student


# ── GET /students/ ───────────────────────────────────────────────────────────
@router.get("", response_model=list[StudentOut])
def list_students(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if current_user.role == "admin":
        return db.query(Student).all()
    if current_user.role == "teacher":
        return db.query(Student).filter(Student.teacher_id == current_user.id).all()
    if current_user.role == "parent":
        return db.query(Student).filter(Student.parent_id == current_user.id).all()
    return db.query(Student).filter(Student.user_id == current_user.id).all()


# ── GET /students/{student_id} ───────────────────────────────────────────────
@router.get("/{student_id}", response_model=StudentOut)
def get_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "admin":
        return student
    elif current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student")
    elif current_user.role == "parent" and student.parent_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your child")

    return student


# ── PUT /students/{student_id} ───────────────────────────────────────────────
@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int,
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student")

    student.full_name = payload.full_name
    student.date_of_birth = payload.date_of_birth
    student.grade = payload.grade
    if payload.user_id:
        student.user_id = payload.user_id

    db.commit()
    db.refresh(student)
    return student


# ── DELETE /students/{student_id} ────────────────────────────────────────────
@router.delete("/{student_id}")
def delete_student(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student")

    db.delete(student)
    db.commit()
    return {"status": "deleted", "id": student_id}


# ── POST /students/{student_id}/create-account ──────────────────────────────
@router.post("/{student_id}/create-account")
def create_student_account(
    student_id: int,
    payload: StudentAccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    """Teacher creates a login account for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student.")

    # Validate via schema — payload is already a real instance now
    pseudo_email = f"{payload.username}@taranga.local"

    # Check username uniqueness
    existing = db.query(User).filter(User.email == pseudo_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Username already taken. Please choose another.")

    # If student already has an account, update it
    if student.user_id:
        user = db.query(User).filter(User.id == student.user_id).first()
        if user:
            user.email = pseudo_email
            user.hashed_password = hash_password(payload.password)
            user.is_active = True
            db.commit()
            return {"username": payload.username, "student_id": student_id, "user_id": user.id, "action": "updated"}

    # Create new User with role=student
    new_user = User(
        full_name=student.full_name,
        email=pseudo_email,
        hashed_password=hash_password(payload.password),
        role="student",
        is_active=True,
    )
    db.add(new_user)
    db.flush()

    student.user_id = new_user.id
    db.commit()

    return {"username": payload.username, "student_id": student_id, "user_id": new_user.id, "action": "created"}


# ── GET /students/{student_id}/account ──────────────────────────────────────
@router.get("/{student_id}/account")
def get_student_account(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    """Return account status for a student."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student.")

    if not student.user_id:
        return {"has_account": False, "student_id": student_id}

    user = db.query(User).filter(User.id == student.user_id).first()
    if not user:
        return {"has_account": False, "student_id": student_id}

    username = user.email.replace("@taranga.local", "")

    # Also return assigned activity keys for this student
    from app.models.assignment import StudentActivityAssignment
    assigned = db.query(StudentActivityAssignment).filter(
        StudentActivityAssignment.student_id == student_id,
        StudentActivityAssignment.is_active == True,
    ).all()

    return {
        "has_account": True,
        "username": username,
        "student_id": student_id,
        "user_id": user.id,
        "is_active": user.is_active,
        "assigned_activities": [a.activity_key for a in assigned],
    }


# ── DELETE /students/{student_id}/account ────────────────────────────────────
@router.delete("/{student_id}/account")
def revoke_student_account(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    """Deactivate (revoke access) for a student's account."""
    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student.")

    if not student.user_id:
        raise HTTPException(status_code=404, detail="Student has no account.")

    user = db.query(User).filter(User.id == student.user_id).first()
    if user:
        user.is_active = False
        db.commit()
    return {"detail": "Student account deactivated."}


# ── GET /students/{student_id}/progress ─────────────────────────────────────
@router.get("/{student_id}/progress")
def get_student_progress(
    student_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    """Teacher views all activity attempts for a student."""
    from app.models.progress import StudentProgress
    from app.models.assignment import StudentActivityAssignment
    from app.ai.activity_catalog import ACTIVITY_BY_KEY

    student = db.query(Student).filter(Student.id == student_id).first()
    if not student:
        raise HTTPException(status_code=404, detail="Student not found.")
    if current_user.role == "teacher" and student.teacher_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your student.")

    # Assigned activity keys
    assignments = db.query(StudentActivityAssignment).filter(
        StudentActivityAssignment.student_id == student_id,
        StudentActivityAssignment.is_active == True,
    ).all()
    assigned_keys = {a.activity_key for a in assignments}

    # All attempts
    attempts = db.query(StudentProgress).filter(
        StudentProgress.student_id == student_id
    ).order_by(StudentProgress.completed_at.desc()).all()

    # Group by activity key
    grouped: dict = {}
    for a in attempts:
        key = a.activity_key
        if key not in grouped:
            meta = ACTIVITY_BY_KEY.get(key, {})
            grouped[key] = {
                "activity_key": key,
                "title": meta.get("title", key),
                "ld_type": meta.get("ld_type", ""),
                "icon": meta.get("icon", "📚"),
                "xp": meta.get("xp", 0),
                "is_assigned": key in assigned_keys,
                "attempts": [],
                "best_score": 0,
                "total_attempts": 0,
            }
        grouped[key]["attempts"].append({
            "attempt_number": a.attempt_number,
            "score": a.score,
            "time_taken_seconds": a.time_taken_seconds,
            "completed_at": a.completed_at.isoformat(),
        })
        grouped[key]["best_score"] = max(grouped[key]["best_score"], a.score)
        grouped[key]["total_attempts"] += 1

    # Account info
    account_info = None
    if student.user_id:
        user = db.query(User).filter(User.id == student.user_id).first()
        if user:
            account_info = {
                "username": user.email.replace("@taranga.local", ""),
                "is_active": user.is_active,
            }

    return {
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "grade": student.grade,
        },
        "account": account_info,
        "assigned_count": len(assigned_keys),
        "activities": list(grouped.values()),
        "total_xp": sum(
            int(ACTIVITY_BY_KEY.get(k, {}).get("xp", 0) * (g["best_score"] / 100))
            for k, g in grouped.items()
        ),
    }
