from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse


router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.get("/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db),
):
    statement = select(Document)

    documents = db.scalars(statement).all()

    return documents