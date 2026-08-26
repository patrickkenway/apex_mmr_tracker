from datetime import datetime
from typing import Optional

from sqlalchemy import DateTime
from sqlalchemy.orm import Mapped, mapped_column

from ..database import Base


class Session(Base):
    __tablename__ = "sessions"

    id: Mapped[int] = mapped_column(primary_key=True)

    started_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
    )

    ended_at: Mapped[Optional[datetime] | None] = mapped_column(
        DateTime,
        nullable=True,
    )
