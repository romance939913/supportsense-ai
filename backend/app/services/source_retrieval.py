from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.schemas.answer import AnswerSource
from app.services.embeddings import embed_query


def retrieve_passages(
    db: Session,
    question: str,
    organization_id: int,
    top_k: int = 5,
) -> list[AnswerSource]:
    question_embedding = embed_query(question)
    distance = DocumentChunk.embedding.cosine_distance(question_embedding)

    statement = (
        select(DocumentChunk, Document)
        .join(Document, Document.id == DocumentChunk.document_id)
        .where(Document.organization_id == organization_id)
        .order_by(distance)
        .limit(top_k)
    )

    results = db.execute(statement).all()

    return [
        AnswerSource(
            citation=citation,
            document_id=document.id,
            filename=document.filename,
            page_number=chunk.page_number,
            passage=chunk.chunk_text,
        )
        for citation, (chunk, document) in enumerate(results, start=1)
    ]
