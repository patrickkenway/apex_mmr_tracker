from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.match import Match
from ..models.session import Session as SessionModel
from ..schemas.match import MatchCreate, MatchResponse

router = APIRouter(
    # prefix="/sessions/{session_id}/matches",
    prefix="/matches",
    tags=["matches"],
)


@router.post("/", response_model=MatchResponse)
def create_match(
    session_id: int,
    match_data: MatchCreate,
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    if session.ended_at is not None:
        raise HTTPException(
            status_code=400,
            detail="Cannot add a match to a finished session",
        )

    last_match = (
        db.query(Match)
        .filter(Match.session_id == session_id)
        .order_by(Match.match_number.desc())
        .first()
    )

    if last_match is None:
        next_match_number = 1
    else:
        next_match_number = last_match.match_number + 1

    match = Match(
        session_id=session_id,
        match_number=next_match_number,
        played_at=match_data.played_at,
    )

    db.add(match)
    db.commit()
    db.refresh(match)

    return match


@router.get("/session/{session_id}", response_model=list[MatchResponse])
def get_matches(
    session_id: int,
    db: Session = Depends(get_db),
):
    session = db.query(SessionModel).filter(SessionModel.id == session_id).first()

    if session is None:
        raise HTTPException(
            status_code=404,
            detail="Session not found",
        )

    return (
        db.query(Match)
        .filter(Match.session_id == session_id)
        .order_by(Match.match_number)
        .all()
    )


# eredeti de vmiert session_idval egyutt kereso szar
#
# @router.get("/{match_id}", response_model=MatchResponse)
# def get_match(
#    session_id: int,
#    match_id: int,
#    db: Session = Depends(get_db),
# ):
#    match = (
#        db.query(Match)
#        .filter(
#            Match.id == match_id,
#            Match.session_id == session_id,
#        )
#        .first()
#    )
#
#    if match is None:
#        raise HTTPException(
#            status_code=404,
#            detail="Match not found",
#        )
#
#    return match


@router.get("/{match_id}", response_model=MatchResponse)
def get_match_by_id(
    match_id: int,
    db: Session = Depends(get_db),
):
    # Meccs lekérése ID alapján
    match = db.query(Match).filter(Match.id == match_id).first()

    if not match:
        raise HTTPException(
            status_code=404,
            detail=f"Match with id {match_id} not found",
        )

    return match
