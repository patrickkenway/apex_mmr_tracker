from pydantic import BaseModel


class MmrRecordCreate(BaseModel):
    player_id: int
    pre_mmr: int
    # post_mmr: int


class MmrRecordResponse(BaseModel):
    id: int
    match_id: int
    player_id: int
    player_name: str
    pre_mmr: int
    post_mmr: int | None
    mmr_change: int | None

    model_config = {"from_attributes": True}
