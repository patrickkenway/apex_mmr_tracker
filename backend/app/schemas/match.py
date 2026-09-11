from datetime import datetime

from pydantic import BaseModel


class MatchCreate(BaseModel):
    #    match_number: int
    played_at: datetime


class MatchResponse(BaseModel):
    id: int
    session_id: int
    match_number: int
    played_at: datetime

    model_config = {"from_attributes": True}
