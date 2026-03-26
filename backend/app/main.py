from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import Base, engine
import app.models
from app.models.user import User
from app.core.deps import get_db , get_current_user, require_role
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_db
from app.models.student import Student 
from app.schemas.user import UserCreate, UserLogin, UserOut
from app.routers import users, students, screenings, progress, reports

app = FastAPI(title="TARANGA")

app.include_router(users.router)
app.include_router(students.router)
app.include_router(screenings.router)
app.include_router(progress.router)
app.include_router(reports.router)




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

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer", "role": user.role}

@app.post("/auth/register")
def register(payload: UserCreate, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email).first()
    if user:
        return {"error": "Email already registered"}
        
    new_user = User(
        full_name=payload.full_name,
        email=payload.email,
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
        "email": current_user.email,
        "role": current_user.role
    }

@app.get("/admin-only")
def admin_only(current_user: User = Depends(require_role("admin"))):
    return {"ok": True, "role": current_user.role}

@app.get("/teacher-only")
def teacher_only(current_user: User = Depends(require_role("teacher"))):
    return {"ok": True, "role": current_user.role}

@app.get("/parent-only")
def parent_only(current_user: User = Depends(require_role("parent"))):
    return {"ok": True, "role": current_user.role}