from app.core.database import SessionLocal
from app.models.user import User
from app.models.student import Student
from app.models.assignment import StudentActivityAssignment
from app.models.progress import StudentProgress

db = SessionLocal()

print("--- TEACHERS ---")
teachers = db.query(User).filter(User.role == "teacher").all()
for t in teachers:
    students = db.query(Student).filter(Student.teacher_id == t.id).all()
    print(f"Teacher {t.full_name} (ID: {t.id}) has {len(students)} students.")
    for s in students:
        accts = db.query(User).filter(User.id == s.user_id).first()
        assignments = db.query(StudentActivityAssignment).filter(StudentActivityAssignment.student_id == s.id).count()
        progress = db.query(StudentProgress).filter(StudentProgress.student_id == s.id).count()
        print(f"  - Student: {s.full_name} (ID: {s.id}), Account: {accts is not None}, Assignments: {assignments}, Progress: {progress}")

db.close()
