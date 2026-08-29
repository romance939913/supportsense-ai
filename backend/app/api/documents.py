from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.database import get_db
from app.models.document import Document
from app.schemas.document import DocumentResponse, DocumentCreate


router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.get("/", response_model=list[DocumentResponse])
def get_documents(
    db: Session = Depends(get_db)
):
    statement = select(Document)

    documents = db.scalars(statement).all()

    return documents


@router.post("/", response_model=DocumentResponse, status_code=201)
def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db)
):
    new_document = Document(
        filename=document.filename,
        storage_path=document.storage_path,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document