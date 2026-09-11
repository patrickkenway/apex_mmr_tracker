from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Integer, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from ..database import Base


class Match(Base):
    __tablename__ = "matches"

    __table_args__ = (
        UniqueConstraint(
            "session_id",
            "match_number",
            name="uq_match_session_number",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    session_id: Mapped[int] = mapped_column(
        ForeignKey("sessions.id"),
        nullable=False,
    )

    match_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    played_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    session = relationship("Session")
