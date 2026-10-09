from dataclasses import dataclass
import re


@dataclass(frozen=True)
class TextChunk:
    index: int
    page_number: int
    text: str


def _split_page(
    text: str,
    max_chars: int,
    overlap_chars: int,
) -> list[str]:
    text = re.sub(r"[ \t]+", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()

    if not text:
        return []

    pieces: list[str] = []
    start = 0

    while start < len(text):
        end = min(start + max_chars, len(text))

        # If possible, end on a word boundary instead of cutting a word.
        if end < len(text):
            boundary = text.rfind(" ", start + max_chars // 2, end)
            if boundary > start:
                end = boundary

        piece = text[start:end].strip()

        if piece:
            pieces.append(piece)

        if end >= len(text):
            break

        next_start = max(end - overlap_chars, start + 1)

        while next_start < len(text) and text[next_start].isspace():
            next_start += 1

        start = next_start

    return pieces


def chunk_pages(
    pages: list[str],
    max_chars: int = 2000,
    overlap_chars: int = 300,
) -> list[TextChunk]:
    if max_chars <= 0:
        raise ValueError("max_chars must be greater than zero")

    if overlap_chars < 0 or overlap_chars >= max_chars:
        raise ValueError(
            "overlap_chars must be non-negative and smaller than max_chars"
        )

    chunks: list[TextChunk] = []

    for page_number, page_text in enumerate(pages, start=1):
        page_pieces = _split_page(
            page_text,
            max_chars=max_chars,
            overlap_chars=overlap_chars,
        )

        for piece in page_pieces:
            chunks.append(
                TextChunk(
                    index=len(chunks) + 1,
                    page_number=page_number,
                    text=piece,
                )
            )

    return chunks