from pydantic import BaseModel
from datetime import datetime


class PlayerCreate(BaseModel):
    name: str
    username: str
    password: str
    apex_username: str
    platform: str


class PlayerResponse(BaseModel):
    id: int
    name: str
    username: str
    apex_username: str
    platform: str

    model_config = {"from_attributes": True}


class PlayerLogin(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class MmrHistoryPoint(BaseModel):
    played_at: datetime
    mmr: int
    session_id: int


class PlayerUpdate(BaseModel):
    name: str | None = None
    username: str | None = None
    apex_username: str | None = None
    platform: str | None = None


class PasswordChangeRequest(BaseModel):
    current_password: str
    new_password: str
