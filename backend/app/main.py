from fastapi import FastAPI, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import Base, engine
import app.models
from app.models.user import User
from app.core.deps import get_db , get_current_user, require_role
from app.core.security import hash_password, verify_password, create_access_token
from app.models.student import Student 
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.routers import users, students, screenings, progress, reports, dashboard, activities

app = FastAPI(title="TARANGA")

app.include_router(users.router)
app.include_router(students.router)
app.include_router(screenings.router)
app.include_router(progress.router)
app.include_router(reports.router)
app.include_router(dashboard.router)
app.include_router(activities.router)




@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-check")
def db_check(db: Session = Depends(get_db)):
    db.execute(text("SELECT 1"))
    return {"db": "connected"}

@app.post("/dev/create-tables")
def create_tables():
    Base.metadata.create_all(bind=engine)
    return {"status": "tables created"}
    
@app.post("/dev/create-admin")
def create_admin(db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == "admin@taranga.local").first()
    if existing:
        return {"status": "admin already exists"}

    admin = User(
        full_name="System Admin",
        email="admin@taranga.local",
        hashed_password=hash_password("admin123"),
        role="admin",
        is_active=True,
    )

    db.add(admin)
    db.commit()
    db.refresh(admin)

    return {"status": "admin created", "email": admin.email}

@app.post("/auth/login")
def login(payload: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()

    if not user or not verify_password(payload.password, user.hashed_password):
        return {"error": "Invalid credentials"}

    if not user.is_active:
        return {"error": "Account is deactivated. Please contact your teacher."}

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer", "role": user.role}


@app.post("/auth/student-login")
def student_login(payload: dict, db: Session = Depends(get_db)):
    """Student login — accepts username (not email)."""
    username = (payload.get("username") or "").strip().lower()
    password = payload.get("password") or ""

    if not username or not password:
        return {"error": "Username and password are required."}

    pseudo_email = f"{username}@taranga.local"
    user = db.query(User).filter(User.email == pseudo_email, User.role == "student").first()

    if not user or not verify_password(password, user.hashed_password):
        return {"error": "Oops! Wrong username or password. Please try again."}

    if not user.is_active:
        return {"error": "Your account is deactivated. Please tell your teacher."}

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer", "role": "student", "full_name": user.full_name}


@app.post("/auth/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    # Pydantic validators already ran — check email uniqueness
    user = db.query(User).filter(User.email == str(payload.email)).first()
    if user:
        raise HTTPException(status_code=400, detail="Email already registered.")

    new_user = User(
        full_name=payload.full_name,
        email=str(payload.email).lower(),
        hashed_password=hash_password(payload.password),
        role=payload.role
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return {"status": "success", "user_id": new_user.id}

@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "full_name": current_user.full_name,
        "email": current_user.email,
        "role": current_user.role,
        "is_active": current_user.is_active,
    }

# ── Pydantic schemas for the /me update endpoints ─────────────────────────
class ProfileUpdate(BaseModel):
    full_name: str
    email: str          # plain str — keeps things simple without extra deps

class PasswordChange(BaseModel):
    current_password: str
    new_password: str

# ── PATCH /me  — update full_name and/or email ────────────────────────────
@app.patch("/me")
def update_me(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # If email changed, make sure it isn't already taken
    if payload.email != current_user.email:
        taken = db.query(User).filter(
            User.email == payload.email,
            User.id != current_user.id,
        ).first()
        if taken:
            raise HTTPException(status_code=400, detail="Email already in use by another account.")

    current_user.full_name = payload.full_name.strip()
    current_user.email     = payload.email.strip().lower()
    db.commit()
    db.refresh(current_user)
    return {
        "id":        current_user.id,
        "full_name": current_user.full_name,
        "email":     current_user.email,
        "role":      current_user.role,
        "is_active": current_user.is_active,
    }

# ── POST /me/change-password ──────────────────────────────────────────────
@app.post("/me/change-password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # Verify the current password first
    if not verify_password(payload.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="New password must be at least 8 characters.")

    import re
    if not re.search(r"[A-Z]", payload.new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one uppercase letter.")
    if not re.search(r"[0-9]", payload.new_password):
        raise HTTPException(status_code=400, detail="New password must contain at least one number.")

    # Reject setting the same password
    if verify_password(payload.new_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="New password must be different from your current password.")

    current_user.hashed_password = hash_password(payload.new_password)
    db.commit()
    return {"status": "Password updated successfully."}

@app.get("/admin-only")
def admin_only(current_user: User = Depends(require_role("admin"))):
    return {"ok": True, "role": current_user.role}

@app.get("/teacher-only")
def teacher_only(current_user: User = Depends(require_role("teacher"))):
    return {"ok": True, "role": current_user.role}

@app.get("/parent-only")
def parent_only(current_user: User = Depends(require_role("parent"))):
    return {"ok": True, "role": current_user.role}