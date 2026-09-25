from pydantic import BaseModel


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
