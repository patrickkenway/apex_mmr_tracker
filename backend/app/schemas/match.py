from datetime import datetime

from pydantic import BaseModel, Field


class MatchCreate(BaseModel):
    #    match_number: int
    played_at: datetime
    player_id: int
    other_player_ids: list[int] = Field(default_factory=list)


class MatchResponse(BaseModel):
    id: int
    session_id: int
    match_number: int
    played_at: datetime

    model_config = {"from_attributes": True}


class MatchDetailsResponse(BaseModel):
    id: int
    session_id: int
    match_number: int
    played_at: datetime
    players: list[dict]
