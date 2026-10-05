from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.match import Match
from ..models.mmr_record import MmrRecord
from ..services.apex import get_player_mmr
from ..database import get_db
from ..models.session import Session as SessionModel
from ..schemas.sessions import SessionCreate, SessionResponse, SessionStatsResponse
from ..models.player import Player
from ..core.dependencies import get_current_player
from ..services.session_service import close_active_matches_and_finish_session

router = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
)


@router.post("/", response_model=SessionResponse)
def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    session = SessionModel(
        player_id=current_player.id,
        started_at=session_data.started_at,
    )

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("/", response_model=list[SessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    return db.query(SessionModel).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    return session


@router.post("/{session_id}/finish", response_model=SessionResponse)
def finish_session(
    session_id: int,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if session.player_id != current_player.id:
        raise HTTPException(
            status_code=403,
            detail="You do not have permission to finish this session",
        )

    if session.ended_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Session is already finished",
        )
    matches = db.query(Match).filter(Match.session_id == session_id).all()

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

    session.ended_at = datetime.now()

    db.commit()
    db.refresh(session)

    return session


@router.get("/{session_id}/stats", response_model=SessionStatsResponse)
def get_session_stats(
    session_id: int,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    records = (
        db.query(MmrRecord)
        .join(Match, MmrRecord.match_id == Match.id)
        .filter(Match.session_id == session_id)
        .order_by(Match.match_number)
        .all()
    )

    first_pre_by_player: dict[int, int] = {}
    last_post_by_player: dict[int, int] = {}
    names_by_player: dict[int, str] = {}

    for record in records:
        player_id = record.player_id
        names_by_player[player_id] = record.player.name

        if player_id not in first_pre_by_player:
            first_pre_by_player[player_id] = record.pre_mmr

        if record.post_mmr is not None:
            last_post_by_player[player_id] = record.post_mmr

    mmr_changes = [
        {
            "player_id": player_id,
            "player_name": names_by_player[player_id],
            "total_mmr_change": last_post_by_player[player_id] - first_pre,
        }
        for player_id, first_pre in first_pre_by_player.items()
        if player_id in last_post_by_player
    ]

    return {
        "session_id": session_id,
        "mmr_changes": mmr_changes,
    }
