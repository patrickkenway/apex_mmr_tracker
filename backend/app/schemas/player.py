from pydantic import BaseModel


class PlayerCreate(BaseModel):
    name: str
    apex_username: str
    platform: str


class PlayerResponse(BaseModel):
    id: int
    name: str
    apex_username: str
    platform: str

    model_config = {"from_attributes": True}
