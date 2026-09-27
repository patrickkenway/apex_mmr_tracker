from sqlalchemy.orm import Session

from ..models.session import Session as SessionModel
from ..models.match import Match
from ..models.mmr_record import MmrRecord
from .apex import get_player_mmr
from ..core.time_utils import budapest_now


def close_active_matches_and_finish_session(
    db: Session,
    session: SessionModel,
) -> None:
    matches = db.query(Match).filter(Match.session_id == session.id).all()

    for match in matches:
        records = db.query(MmrRecord).filter(MmrRecord.match_id == match.id).all()

        if not records:
            continue

        match_finished = all(record.post_mmr is not None for record in records)

        if match_finished:
            continue

        for record in records:
            if record.post_mmr is None:
                post_mmr = get_player_mmr(
                    apex_username=record.player.apex_username,
                    platform=record.player.platform,
                )

                record.post_mmr = post_mmr

    session.ended_at = budapest_now()
