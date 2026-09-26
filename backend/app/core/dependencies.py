from fastapi import Depends, HTTPException, status
from fastapi.security import (
    OAuth2PasswordBearer,
    HTTPBearer,
    HTTPAuthorizationCredentials,
)
from jose import JWTError
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.player import Player
from .security import decode_access_token

# oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")
bearer_scheme = HTTPBearer()


def get_current_player(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> Player:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        player_id = decode_access_token(credentials.credentials)
    except JWTError:
        raise credentials_exception

    player = db.query(Player).filter(Player.id == player_id).first()

    if player is None:
        raise credentials_exception

    return player
