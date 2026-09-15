from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.match import Match
from ..models.mmr_record import MmrRecord
from ..models.player import Player
from ..schemas.mmr_record import (
    MmrRecordCreate,
    MmrRecordResponse,
)

router = APIRouter(
    prefix="/matches/{match_id}/mmr",
    tags=["mmr"],
)


@router.post("/", response_model=MmrRecordResponse)
def create_mmr_record(
    match_id: int,
    mmr_data: MmrRecordCreate,
    db: Session = Depends(get_db),
):
    match = db.query(Match).filter(Match.id == match_id).first()

    if match is None:
        raise HTTPException(
            status_code=404,
            detail="Match not found",
        )

    player = db.query(Player).filter(Player.id == mmr_data.player_id).first()

    if player is None:
        raise HTTPException(
            status_code=404,
            detail="Player not found",
        )

    existing_record = (
        db.query(MmrRecord)
        .filter(
            MmrRecord.match_id == match_id,
            MmrRecord.player_id == mmr_data.player_id,
        )
        .first()
    )

    if existing_record is not None:
        raise HTTPException(
            status_code=400,
            detail="MMR record already exists for this player in this match",
        )

    record = MmrRecord(
        match_id=match_id,
        player_id=mmr_data.player_id,
        pre_mmr=mmr_data.pre_mmr,
        post_mmr=mmr_data.post_mmr,
    )

    db.add(record)
    db.commit()
    db.refresh(record)

    return record


@router.get("/", response_model=list[MmrRecordResponse])
def get_mmr_records(
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

    return [
        {
            "id": record.id,
            "match_id": record.match_id,
            "player_id": record.player_id,
            "player_name": record.player.name,
            "pre_mmr": record.pre_mmr,
            "post_mmr": record.post_mmr,
            "mmr_change": record.post_mmr - record.pre_mmr,
        }
        for record in records
    ]
