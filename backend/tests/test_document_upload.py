from io import BytesIO
from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException
from pypdf import PdfWriter
from starlette.datastructures import Headers, UploadFile

from app.api.documents import upload_document
from app.services.pdf_extraction import MAX_PDF_UPLOAD_BYTES


def make_pdf(page_count: int) -> bytes:
    writer = PdfWriter()
    for _ in range(page_count):
        writer.add_blank_page(width=72, height=72)
    output = BytesIO()
    writer.write(output)
    return output.getvalue()


def upload(filename: str, data: bytes) -> UploadFile:
    return UploadFile(
        filename=filename,
        file=BytesIO(data),
        headers=Headers({"content-type": "application/pdf"}),
    )


class DocumentUploadTests(unittest.TestCase):
    def setUp(self):
        self.db = Mock()
        self.user = SimpleNamespace(id=7, organization_id=3)

    def test_accepts_a_ten_page_pdf_and_processes_it(self):
        pdf = upload("guide.pdf", make_pdf(10))
        with patch("app.api.documents.upload_file") as store, patch(
            "app.api.documents.process_document", return_value=1
        ) as process:
            document = upload_document(pdf, db=self.db, current_user=self.user)

        store.assert_called_once()
        self.assertEqual(store.call_args.kwargs["file_bytes"], pdf.file.getvalue())
        process.assert_called_once_with(self.db, document)
        self.assertEqual(document.organization_id, 3)

    def test_rejects_non_pdf_filename_before_storage(self):
        with patch("app.api.documents.upload_file") as store:
            with self.assertRaises(HTTPException) as raised:
                upload_document(
                    upload("guide.txt", b"not a pdf"),
                    db=self.db,
                    current_user=self.user,
                )

        self.assertEqual(raised.exception.status_code, 415)
        store.assert_not_called()

    def test_rejects_non_pdf_content_even_with_pdf_extension(self):
        with patch("app.api.documents.upload_file") as store:
            with self.assertRaises(HTTPException) as raised:
                upload_document(
                    upload("fake.pdf", b"not a pdf"),
                    db=self.db,
                    current_user=self.user,
                )

        self.assertEqual(raised.exception.status_code, 400)
        self.assertIn("not a readable PDF", raised.exception.detail)
        store.assert_not_called()

    def test_rejects_more_than_ten_pages_before_storage(self):
        with patch("app.api.documents.upload_file") as store:
            with self.assertRaises(HTTPException) as raised:
                upload_document(
                    upload("long-guide.pdf", make_pdf(11)),
                    db=self.db,
                    current_user=self.user,
                )

        self.assertEqual(raised.exception.status_code, 413)
        self.assertIn("10 pages or fewer", raised.exception.detail)
        store.assert_not_called()

    def test_rejects_upload_larger_than_ten_mib_before_parsing(self):
        with patch("app.api.documents.get_pdf_page_count") as page_count, patch(
            "app.api.documents.upload_file"
        ) as store:
            with self.assertRaises(HTTPException) as raised:
                upload_document(
                    upload("large.pdf", b"x" * (MAX_PDF_UPLOAD_BYTES + 1)),
                    db=self.db,
                    current_user=self.user,
                )

        self.assertEqual(raised.exception.status_code, 413)
        page_count.assert_not_called()
        store.assert_not_called()


if __name__ == "__main__":
    unittest.main()
