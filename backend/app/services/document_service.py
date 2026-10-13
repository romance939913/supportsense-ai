from sqlalchemy import delete
from sqlalchemy.orm import Session

from app.models.document import Document
from app.models.document_chunk import DocumentChunk
from app.services.chunking import chunk_pages
from app.services.embeddings import EMBEDDING_MODEL, embed_texts
from app.services.pdf_extraction import extract_pdf_pages
from app.services.s3 import download_file


class DocumentProcessingError(Exception):
    pass


def process_document(db: Session, document: Document) -> int:
    try:
        pdf_bytes = download_file(document.storage_path)
    except Exception as exc:
        raise DocumentProcessingError(
            "Unable to download document from storage"
        ) from exc

    try:
        pages = extract_pdf_pages(pdf_bytes)
    except Exception as exc:
        raise DocumentProcessingError(
            "Unable to read this file as a PDF"
        ) from exc

    chunks = chunk_pages(pages)

    if not chunks:
        raise DocumentProcessingError(
            "No extractable text found in this document"
        )

    try:
        vectors = embed_texts([chunk.text for chunk in chunks])
    except Exception as exc:
        raise DocumentProcessingError(
            "Unable to generate document embeddings"
        ) from exc

    try:
        db.execute(
            delete(DocumentChunk).where(
                DocumentChunk.document_id == document.id
            )
        )

        db.add_all(
            [
                DocumentChunk(
                    document_id=document.id,
                    chunk_index=chunk.index,
                    page_number=chunk.page_number,
                    chunk_text=chunk.text,
                    embedding=vector,
                    embedding_model=EMBEDDING_MODEL,
                )
                for chunk, vector in zip(chunks, vectors, strict=True)
            ]
        )

        db.commit()
    except Exception as exc:
        db.rollback()
        raise DocumentProcessingError(
            "Unable to store document chunks"
        ) from exc

    return len(chunks) 