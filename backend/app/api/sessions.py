from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime

from ..models.match import Match
from ..models.mmr_record import MmrRecord
from ..services.apex import get_player_mmr
from ..database import get_db
from ..models.session import Session as SessionModel
from ..schemas.sessions import SessionCreate, SessionResponse


router = APIRouter(
    prefix="/sessions",
    tags=["sessions"],
)


@router.post("/", response_model=SessionResponse)
def create_session(
    session_data: SessionCreate,
    db: Session = Depends(get_db),
):
    # ez volt eredetileg
    session = SessionModel(
        started_at=session_data.started_at,
    )
    # session = SessionModel(started_at=datetime.now())

    db.add(session)
    db.commit()
    db.refresh(session)

    return session


@router.get("/", response_model=list[SessionResponse])
def get_sessions(
    db: Session = Depends(get_db),
):
    return db.query(SessionModel).all()


@router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: int,
    db: Session = Depends(get_db),
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
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
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
