from datetime import datetime
from sqlalchemy import Float, ForeignKey, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

class PredictionResult(Base):
    __tablename__ = "prediction_results"

    id: Mapped[int] = mapped_column(primary_key=True)
    screening_id: Mapped[int] = mapped_column(ForeignKey("screenings.id", ondelete="CASCADE"), unique=True)
    
    dyslexia_score: Mapped[float] = mapped_column(Float, default=0.0)
    dyscalculia_score: Mapped[float] = mapped_column(Float, default=0.0)
    dysgraphia_score: Mapped[float] = mapped_column(Float, default=0.0)
    nvld_score: Mapped[float] = mapped_column(Float, default=0.0)
    apd_score: Mapped[float] = mapped_column(Float, default=0.0)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)

    screening = relationship("Screening", backref="prediction")
