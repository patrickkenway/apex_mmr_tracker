from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.player import Player
from ..schemas.player import PlayerLogin, PlayerResponse
from ..core.security import verify_password


router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/login", response_model=PlayerResponse)
def login(
    credentials: PlayerLogin,
    db: Session = Depends(get_db),
):
    player = db.query(Player).filter(Player.username == credentials.username).first()

    if player is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    if not verify_password(credentials.password, player.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid username or password",
        )

    return player
