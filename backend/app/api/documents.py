import uuid

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.api.dependencies import get_current_user
from app.db.database import get_db
from app.models.document import Document
from app.models.user import User
from app.schemas.document import (
    DocumentCreate,
    DocumentResponse,
    DocumentUpdate,
)
from app.services.s3 import delete_file, upload_file


router = APIRouter(
    prefix="/documents",
    tags=["documents"],
)


@router.post(
    "/upload",
    response_model=DocumentResponse,
    status_code=201,
)
async def upload_document(
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="Filename is required",
        )

    file_bytes = await file.read()

    document_id = uuid.uuid4().hex

    object_key = f"documents/{document_id}/{file.filename}"

    try:
        upload_file(
            file_bytes=file_bytes,
            object_key=object_key,
            content_type=file.content_type,
        )
    except RuntimeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to upload document",
        )

    new_document = Document(
        organization_id=current_user.organization_id,
        uploaded_by=current_user.id,
        filename=file.filename,
        storage_path=object_key,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document


@router.get(
    "/",
    response_model=list[DocumentResponse],
)
def get_documents(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = (
        select(Document)
        .where(
            Document.organization_id
            == current_user.organization_id
        )
        .order_by(Document.created_at.desc())
    )

    return db.scalars(statement).all()


@router.get(
    "/{document_id}",
    response_model=DocumentResponse,
)
def get_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Document).where(
        Document.id == document_id,
        Document.organization_id
        == current_user.organization_id,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    return document


@router.post(
    "/",
    response_model=DocumentResponse,
    status_code=201,
)
def create_document(
    document: DocumentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    new_document = Document(
        organization_id=current_user.organization_id,
        uploaded_by=current_user.id,
        filename=document.filename,
        storage_path=document.storage_path,
    )

    db.add(new_document)
    db.commit()
    db.refresh(new_document)

    return new_document


@router.patch(
    "/{document_id}",
    response_model=DocumentResponse,
)
def update_document(
    document_id: int,
    document_update: DocumentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Document).where(
        Document.id == document_id,
        Document.organization_id
        == current_user.organization_id,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    update_data = document_update.model_dump(
        exclude_unset=True
    )

    for field, value in update_data.items():
        setattr(document, field, value)

    db.commit()
    db.refresh(document)

    return document


@router.delete(
    "/{document_id}",
    status_code=204,
)
def delete_document(
    document_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    statement = select(Document).where(
        Document.id == document_id,
        Document.organization_id
        == current_user.organization_id,
    )

    document = db.scalar(statement)

    if document is None:
        raise HTTPException(
            status_code=404,
            detail="Document not found",
        )

    try:
        delete_file(document.storage_path)
    except RuntimeError:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete document from storage",
        )

    db.delete(document)
    db.commit()
