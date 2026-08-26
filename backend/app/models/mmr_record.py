from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import ForeignKey, Integer, UniqueConstraint

from ..database import Base


class MmrRecord(Base):
    __tablename__ = "mmr_records"

    __table_args__ = (
        UniqueConstraint(
            "match_id",
            "player_id",
            name="uq_mmr_record_match_player",
        ),
    )

    id: Mapped[int] = mapped_column(primary_key=True)

    match_id: Mapped[int] = mapped_column(
        ForeignKey("matches.id"),
        nullable=False,
    )

    player_id: Mapped[int] = mapped_column(
        ForeignKey("players.id"),
        nullable=False,
    )

    pre_mmr: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    post_mmr: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    match = relationship("Match")
    player = relationship("Player")
