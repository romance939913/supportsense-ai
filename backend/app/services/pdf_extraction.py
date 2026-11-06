from io import BytesIO

from pypdf import PdfReader


MAX_PDF_PAGES = 10
MAX_PDF_UPLOAD_BYTES = 10 * 1024 * 1024


def get_pdf_page_count(pdf_bytes: bytes) -> int:
    reader = PdfReader(BytesIO(pdf_bytes), strict=False)
    return len(reader.pages)


def extract_pdf_pages(pdf_bytes: bytes) -> list[str]:
    reader = PdfReader(BytesIO(pdf_bytes), strict=False)

    return [
        page.extract_text() or ""
        for page in reader.pages
    ]
