from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.match import Match
from ..models.session import Session as SessionModel
from ..models.mmr_record import MmrRecord
from ..models.player import Player
from ..services.apex import get_player_mmr

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

    # A kezdő játékos lekérése
    starting_player = db.query(Player).filter(Player.id == match_data.player_id).first()

    if starting_player is None:
        raise HTTPException(
            status_code=404,
            detail="Starting player not found",
        )

    # Összegyűjtjük a meccs játékosait
    player_ids = [
        match_data.player_id,
        *match_data.other_player_ids,
    ]

    # Duplikált játékosok ellenőrzése
    if len(player_ids) != len(set(player_ids)):
        raise HTTPException(
            status_code=400,
            detail="A player cannot be added to a match more than once",
        )

    # Jelenleg maximum 3 játékos lehet egy meccsen
    if len(player_ids) > 3:
        raise HTTPException(
            status_code=400,
            detail="A match can have at most 3 players",
        )

    # Játékosok lekérése
    players = db.query(Player).filter(Player.id.in_(player_ids)).all()

    if len(players) != len(player_ids):
        raise HTTPException(
            status_code=404,
            detail="One or more players not found",
        )

    # Következő meccsszám
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

    # Meccs létrehozása
    match = Match(
        session_id=session_id,
        match_number=next_match_number,
        played_at=match_data.played_at,
    )

    db.add(match)
    db.flush()

    # MMR rekordok létrehozása
    for player in players:
        pre_mmr = get_player_mmr(
            apex_username=player.apex_username,
            platform=player.platform,
        )

        record = MmrRecord(
            match_id=match.id,
            player_id=player.id,
            pre_mmr=pre_mmr,
            post_mmr=None,
        )

        db.add(record)

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


@router.post("/{match_id}/finish")
def finish_match(
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

    if not records:
        raise HTTPException(
            status_code=400,
            detail="Match has no players",
        )

    # Ellenőrizzük, hogy a meccs még nincs-e lezárva
    if any(record.post_mmr is not None for record in records):
        raise HTTPException(
            status_code=400,
            detail="Match is already finished",
        )

    # Minden játékos aktuális MMR-jének lekérése
    for record in records:
        post_mmr = get_player_mmr(
            apex_username=record.player.apex_username,
            platform=record.player.platform,
        )

        record.post_mmr = post_mmr

    db.commit()

    return {
        "message": "Match finished successfully",
        "match_id": match.id,
    }
