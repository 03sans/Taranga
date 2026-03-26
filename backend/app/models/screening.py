from datetime import datetime
from sqlalchemy import JSON, String, Text, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class Screening(Base):
    __tablename__ = "screenings"

    id: Mapped[int] = mapped_column(primary_key=True)
    student_id: Mapped[int] = mapped_column(ForeignKey("students.id"), index=True)
    assessor_id: Mapped[int] = mapped_column(ForeignKey("users.id"), index=True)  # Teacher or parent id
    
    # Store dynamic questionnaire answers
    answers: Mapped[dict] = mapped_column(JSON, default=dict)
    
    # Free-text observation notes for NLP
    nlp_notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    student = relationship("Student", foreign_keys=[student_id])
    assessor = relationship("User", foreign_keys=[assessor_id])
