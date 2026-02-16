from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.core.database import Base, engine
from app.models.user import User
from app.core.deps import get_db , get_current_user
from app.core.security import hash_password, verify_password, create_access_token
from app.core.deps import get_db

app = FastAPI(title="TARANGA")

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
def login(email: str, password: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == email).first()

    if not user or not verify_password(password, user.hashed_password):
        return {"error": "Invalid credentials"}

    token = create_access_token(subject=str(user.id))
    return {"access_token": token, "token_type": "bearer"}

@app.get("/me")
def read_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role
    }