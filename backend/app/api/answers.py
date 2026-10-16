from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.user import User
from app.schemas.answer import AnswerRequest, AnswerResponse
from app.services.answer_generation import generate_answer
from app.services.source_retrieval import retrieve_passages


router = APIRouter(prefix="/rag", tags=["rag"])


@router.post("/answer", response_model=AnswerResponse)
def answer_question(
    request: AnswerRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    question = request.question.strip()
    if len(question) < 3:
        raise HTTPException(
            status_code=422,
            detail="Question must contain at least 3 non-whitespace characters",
        )

    try:
        sources = retrieve_passages(
            db=db,
            question=question,
            organization_id=current_user.organization_id,
            top_k=request.top_k,
        )
        answer = generate_answer(question, sources)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to generate an answer from support documentation",
        ) from exc

    return AnswerResponse(answer=answer, sources=sources)
