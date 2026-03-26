from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.core.deps import get_db, require_role, get_current_user
from app.models.student import Student
from app.models.user import User
from app.schemas.student import StudentCreate, StudentOut

router = APIRouter(prefix="/students", tags=["Students"])

@router.post("/", response_model=StudentOut)
def create_student(
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher")),
):
    teacher_id = current_user.id if current_user.role == "teacher" else current_user.id
    student = Student(
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        grade=payload.grade,
        teacher_id=teacher_id,
        user_id=payload.user_id,
    )
    db.add(student)
    db.commit()
    db.refresh(student)
    return student

@router.get("/", response_model=list[StudentOut])
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
    # If student
    return db.query(Student).filter(Student.user_id == current_user.id).all()

@router.get("/{student_id}", response_model=StudentOut)
def get_student(
    student_id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
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
    elif current_user.role == "student" and student.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not yours")
        
    return student
    
@router.put("/{student_id}", response_model=StudentOut)
def update_student(
    student_id: int, 
    payload: StudentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("admin", "teacher"))
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
