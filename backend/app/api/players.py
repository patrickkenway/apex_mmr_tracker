from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException

from ..core.security import hash_password, verify_password
from ..services.apex import get_player_mmr
from ..database import get_db
from ..models.player import Player
from ..models.match import Match
from ..models.mmr_record import MmrRecord
from ..core.dependencies import get_current_player
from ..schemas.player import (
    PlayerCreate,
    PlayerResponse,
    MmrHistoryPoint,
    PlayerUpdate,
    PasswordChangeRequest,
)

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


@router.get("/{player_id}/mmr-history", response_model=list[MmrHistoryPoint])
def get_mmr_history(
    player_id: int,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    records = (
        db.query(MmrRecord)
        .join(Match, MmrRecord.match_id == Match.id)
        .filter(MmrRecord.player_id == player_id)
        .filter(MmrRecord.post_mmr.isnot(None))
        .order_by(Match.played_at)
        .all()
    )

    return [
        {
            "played_at": record.match.played_at,
            "mmr": record.post_mmr,
            "session_id": record.match.session_id,
        }
        for record in records
    ]


@router.patch("/me", response_model=PlayerResponse)
def update_my_profile(
    update_data: PlayerUpdate,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    if (
        update_data.username is not None
        and update_data.username != current_player.username
    ):
        existing = (
            db.query(Player).filter(Player.username == update_data.username).first()
        )

        if existing is not None:
            raise HTTPException(
                status_code=400,
                detail="Username already taken",
            )

        current_player.username = update_data.username

    if update_data.name is not None:
        current_player.name = update_data.name

    apex_changed = (
        update_data.apex_username is not None or update_data.platform is not None
    )

    if apex_changed:
        new_apex_username = update_data.apex_username or current_player.apex_username
        new_platform = update_data.platform or current_player.platform

        try:
            get_player_mmr(
                apex_username=new_apex_username,
                platform=new_platform,
            )
        except Exception:
            raise HTTPException(
                status_code=400,
                detail="Could not verify Apex account with the given username/platform",
            )

        current_player.apex_username = new_apex_username
        current_player.platform = new_platform

    db.commit()
    db.refresh(current_player)

    return current_player


@router.post("/me/change-password")
def change_my_password(
    data: PasswordChangeRequest,
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    if not verify_password(data.current_password, current_player.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Current password is incorrect",
        )

    current_player.password_hash = hash_password(data.new_password)
    db.commit()

    return {"message": "Password updated successfully"}
