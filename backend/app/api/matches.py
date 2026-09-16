from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.match import Match
from ..models.session import Session as SessionModel
from ..models.mmr_record import MmrRecord
from ..models.player import Player
from ..services.apex import get_players_mmr

from ..schemas.match import (
    MatchCreate,
    MatchResponse,
    MatchDetailsResponse,
)

router = APIRouter(
    # prefix="/sessions/{session_id}/matches",
    prefix="/matches",
    tags=["matches"],
)


@router.post("/", response_model=MatchResponse)
def create_match(
    session_id: int,
    match_data: MatchCreate,
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
            detail="Cannot add a match to a finished session",
        )

    last_match = (
        db.query(Match)
        .filter(Match.session_id == session_id)
        .order_by(Match.match_number.desc())
        .first()
    )

    if last_match is None:
        next_match_number = 1
    else:
        next_match_number = last_match.match_number + 1

    # Aktuális MMR-ek lekérése az Apex API-ból
    current_mmr = get_players_mmr()

    match = Match(
        session_id=session_id,
        match_number=next_match_number,
        played_at=match_data.played_at,
    )

    db.add(match)
    db.flush()

    patrik = db.query(Player).filter(Player.apex_username == "patrickkenway").first()

    noel = db.query(Player).filter(Player.apex_username == "TragicSleet364").first()

    if patrik is None or noel is None:
        db.rollback()
        raise HTTPException(
            status_code=404,
            detail="Required players not found",
        )

    patrik_record = MmrRecord(
        match_id=match.id,
        player_id=patrik.id,
        pre_mmr=current_mmr["patrik"],
    )

    noel_record = MmrRecord(
        match_id=match.id,
        player_id=noel.id,
        pre_mmr=current_mmr["noel"],
    )

    db.add(patrik_record)
    db.add(noel_record)

    db.commit()
    db.refresh(match)

    return match


@router.get("/session/{session_id}", response_model=list[MatchResponse])
def get_matches(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    return (
        db.query(Match)
        .filter(Match.session_id == session_id)
        .order_by(Match.match_number)
        .all()
    )


# eredeti de vmiert session_idval egyutt kereso szar
#
# @router.get("/{match_id}", response_model=MatchResponse)
# def get_match(
#    session_id: int,
#    match_id: int,
#    db: Session = Depends(get_db),
# ):
#    match = (
#        db.query(Match)
#        .filter(
#            Match.id == match_id,
#            Match.session_id == session_id,
#        )
#        .first()
#    )
#
#    if match is None:
#        raise HTTPException(
#            status_code=404,
#            detail="Match not found",
#        )
#
#    return match


# @router.get("/{match_id}", response_model=MatchResponse)
# def get_match_by_id(
#    match_id: int,
#    db: Session = Depends(get_db),
# ):
#    # Meccs lekérése ID alapján
#    match = db.query(Match).filter(Match.id == match_id).first()
#
#    if not match:
#        raise HTTPException(
#            status_code=404,
#            detail=f"Match with id {match_id} not found",
#        )
#
#    return match


@router.get("/{match_id}", response_model=MatchDetailsResponse)
def get_match_details(
    match_id: int,
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="Match not found",
        )

    records = db.query(MmrRecord).filter(MmrRecord.match_id == match_id).all()

    players = [
        {
            "player_id": record.player_id,
            "player_name": record.player.name,
            "pre_mmr": record.pre_mmr,
            "post_mmr": record.post_mmr,
            "mmr_change": (
                record.post_mmr - record.pre_mmr
                if record.post_mmr is not None
                else None
            ),
        }
        for record in records
    ]

    return {
        "id": match.id,
        "session_id": match.session_id,
        "match_number": match.match_number,
        "played_at": match.played_at,
        "players": players,
    }
