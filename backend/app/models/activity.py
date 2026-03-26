from datetime import datetime
from sqlalchemy import JSON, String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column

from app.core.database import Base

class InterventionActivity(Base):
    __tablename__ = "intervention_activities"

    id: Mapped[int] = mapped_column(primary_key=True)
    ld_type: Mapped[str] = mapped_column(String(50), index=True)  # e.g., 'dyslexia', 'dyscalculia'
    title: Mapped[str] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    
    # Metadata for the interactive frontend component
    interactive_data: Mapped[dict] = mapped_column(JSON, default=dict)
    
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
