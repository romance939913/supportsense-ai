from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Response
from fastapi import Query
import random
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.db.database import get_db
from app.models.document import Document
from app.models.suggested_question import SuggestedQuestion
from app.schemas.answer import AnswerRequest, AnswerResponse
from app.services.chat_quota import (
    ChatQuotaExceeded,
    reserve_chat_request,
    seconds_until_quota_reset,
)
from app.services.answer_generation import generate_answer
from app.services.s3 import download_file
from app.services.source_retrieval import retrieve_passages


router = APIRouter(prefix="/rag", tags=["rag"])


@router.get("/suggested-questions", response_model=list[str])
def get_suggested_questions(
    count: int = Query(default=3, ge=1, le=10),
    db: Session = Depends(get_db),
):
    questions = db.scalars(
        select(SuggestedQuestion.question).where(SuggestedQuestion.active.is_(True))
    ).all()
    return random.sample(questions, min(count, len(questions)))


@router.get("/documents/{document_id}/preview")
def preview_public_document(
    document_id: int,
    db: Session = Depends(get_db),
):
    statement = select(Document).where(
        Document.id == document_id,
        Document.organization_id == settings.public_organization_id,
    )
    document = db.scalar(statement)

    if document is None:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        file_bytes = download_file(document.storage_path)
    except RuntimeError as exc:
        raise HTTPException(status_code=500, detail="Failed to load document") from exc

    filename = quote(document.filename, safe="")
    return Response(
        content=file_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"inline; filename*=UTF-8''{filename}"},
    )


@router.post("/answer", response_model=AnswerResponse)
def answer_question(
    request: AnswerRequest,
    db: Session = Depends(get_db),
):
    question = request.question.strip()
    if len(question) < 3:
        raise HTTPException(
            status_code=422,
            detail="Question must contain at least 3 non-whitespace characters",
        )

    if request.organization_id != settings.public_organization_id:
        raise HTTPException(
            status_code=403,
            detail="The public support chat is not available for this organization.",
        )

    try:
        reserve_chat_request(db, request.visitor_id)
    except ChatQuotaExceeded as exc:
        if exc.scope == "global":
            message = "Today’s support chat limit has been reached. Please try again tomorrow."
        else:
            message = "You’ve reached your daily chat limit. Please try again tomorrow."
        raise HTTPException(
            status_code=429,
            detail={
                "code": "daily_chat_limit_reached",
                "scope": exc.scope,
                "message": message,
            },
            headers={"Retry-After": str(seconds_until_quota_reset())},
        ) from exc

    try:
        sources = retrieve_passages(
            db=db,
            question=question,
            organization_id=settings.public_organization_id,
            top_k=request.top_k,
        )
        answer = generate_answer(question, sources)
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail="Unable to generate an answer from support documentation",
        ) from exc

    return AnswerResponse(answer=answer, sources=sources)
