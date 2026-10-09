from io import BytesIO

from pypdf import PdfReader


def extract_pdf_pages(pdf_bytes: bytes) -> list[str]:
    reader = PdfReader(BytesIO(pdf_bytes), strict=False)

    return [
        page.extract_text() or ""
        for page in reader.pages
    ]