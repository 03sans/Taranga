from datetime import datetime
from sqlalchemy import Float, ForeignKey, DateTime, String, Integer
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StudentProgress(Base):
    """
    Each row = one attempt at one activity by one student.
    Multiple rows per (student, activity_key) are allowed — every replay
    creates a new row for progress tracking.
    """
    __tablename__ = "student_progress"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), index=True
    )
    activity_key: Mapped[str] = mapped_column(String(80), index=True)

    score: Mapped[float] = mapped_column(Float, default=0.0)
    time_taken_seconds: Mapped[int] = mapped_column(Integer, default=0)
    attempt_number: Mapped[int] = mapped_column(Integer, default=1)

    completed_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student = relationship("Student", foreign_keys=[student_id])
