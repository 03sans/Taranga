from datetime import datetime
from sqlalchemy import String, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class StudentActivityAssignment(Base):
    __tablename__ = "student_activity_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)

    student_id: Mapped[int] = mapped_column(
        ForeignKey("students.id", ondelete="CASCADE"), index=True
    )
    activity_key: Mapped[str] = mapped_column(String(80), index=True)
    assigned_by: Mapped[int] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    assigned_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    student = relationship("Student", foreign_keys=[student_id])
    teacher = relationship("User", foreign_keys=[assigned_by])
