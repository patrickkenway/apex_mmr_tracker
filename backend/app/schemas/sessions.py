from datetime import datetime

from pydantic import BaseModel


class SessionCreate(BaseModel):
    started_at: datetime


class SessionResponse(BaseModel):
    id: int
    started_at: datetime
    ended_at: datetime | None

    model_config = {"from_attributes": True}
