from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.player import Player
from ..schemas.player import PlayerLogin, TokenResponse, PlayerResponse
from ..core.security import verify_password, create_access_token
from ..core.dependencies import get_current_player
from ..models.session import Session as SessionModel
from ..services.session_service import close_active_matches_and_finish_session

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post("/login", response_model=TokenResponse)
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

    access_token = create_access_token(player.id)

    return TokenResponse(access_token=access_token)


@router.get("/me", response_model=PlayerResponse)
def read_current_player(
    current_player: Player = Depends(get_current_player),
):
    return current_player


@router.post("/logout")
def logout(
    db: Session = Depends(get_db),
    current_player: Player = Depends(get_current_player),
):
    active_session = (
        db.query(SessionModel)
        .filter(SessionModel.player_id == current_player.id)
        .filter(SessionModel.ended_at.is_(None))
        .first()
    )

    if active_session is not None:
        close_active_matches_and_finish_session(db, active_session)
        db.commit()

    return {"message": "Logged out successfully"}
