from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from ..database import get_db
from ..models.player import Player
from ..schemas.player import PlayerCreate, PlayerResponse


router = APIRouter(
    prefix="/players",
    tags=["players"],
)


@router.post("/", response_model=PlayerResponse)
def create_player(
    player_data: PlayerCreate,
    db: Session = Depends(get_db),
):
    player = Player(
        name=player_data.name,
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
