from datetime import datetime

from pydantic import BaseModel


class SessionCreate(BaseModel):
    started_at: datetime


class SessionResponse(BaseModel):
    id: int
    player_id: int
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}


class PlayerMmrChange(BaseModel):
    player_id: int
    player_name: str
    total_mmr_change: int


class SessionStatsResponse(BaseModel):
    session_id: int
    mmr_changes: list[PlayerMmrChange]
