from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from ..core.security import hash_password
from ..database import get_db
from ..models.player import Player
from ..models.match import Match
from ..models.mmr_record import MmrRecord
from ..core.dependencies import get_current_player
from ..schemas.player import PlayerCreate, PlayerResponse, MmrHistoryPoint

router = APIRouter(
    prefix="/players",
    tags=["players"],
)


@router.post("/", response_model=PlayerResponse)
def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
):
    existing = db.query(Player).filter(Player.username == player_data.username).first()

    if existing is not None:
        raise HTTPException(
            status_code=400,
            detail="Username already taken",
        )

    player = Player(
        name=player_data.name,
        username=player_data.username,
        password_hash=hash_password(player_data.password),
        apex_username=player_data.apex_username,
        platform=player_data.platform,
    )

    db.add(player)
    db.commit()
    db.refresh(player)

    return player


@router.get("/", response_model=list[PlayerResponse])
def get_players(
    db: Session = Depends(get_db),
):
    return db.query(Player).all()


@router.get("/{player_id}", response_model=PlayerResponse)
def get_player(
    player_id: int,
    db: Session = Depends(get_db),
):
    player = db.query(Player).filter(Player.id == player_id).first()

    if player is None:
        raise HTTPException(
            status_code=404,
            detail="Player not found",
        )
    return player


@router.get("/me/mmr-history", response_model=list[MmrHistoryPoint])
def get_my_mmr_history(
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    records = (
        db.query(MmrRecord)
        .join(Match, MmrRecord.match_id == Match.id)
        .filter(MmrRecord.player_id == current_player.id)
        .filter(MmrRecord.post_mmr.isnot(None))
        .order_by(Match.played_at)
        .all()
    )

    return [
        {"played_at": record.match.played_at, "mmr": record.post_mmr}
        for record in records
    ]
