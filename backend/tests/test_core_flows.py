from types import SimpleNamespace
import unittest
from unittest.mock import Mock, patch

from fastapi import HTTPException

from app.api.answers import answer_question
from app.api.dependencies import require_support_admin
from app.schemas.answer import AnswerRequest
from app.services.auth_service import authenticate_user
from app.services.chat_quota import ChatQuotaExceeded


class CoreFlowTests(unittest.TestCase):
    def test_support_admin_gate_accepts_admin_and_rejects_customer(self):
        admin = SimpleNamespace(role="support_admin")
        customer = SimpleNamespace(role="customer")

        self.assertIs(require_support_admin(admin), admin)
        with self.assertRaises(HTTPException) as raised:
            require_support_admin(customer)
        self.assertEqual(raised.exception.status_code, 403)

    def test_authentication_rejects_unknown_user_and_bad_password(self):
        db = Mock()
        db.query.return_value.filter.return_value.first.return_value = None
        with patch("app.services.auth_service.verify_password") as verify:
            self.assertIsNone(authenticate_user(db, "unknown@example.com", "password"))
            verify.assert_not_called()

        user = SimpleNamespace(password_hash="hashed")
        db.query.return_value.filter.return_value.first.return_value = user
        with patch("app.services.auth_service.verify_password", return_value=False):
            self.assertIsNone(authenticate_user(db, "user@example.com", "wrong"))

    def test_chat_rejects_other_organizations_before_using_quota_or_rag(self):
        request = AnswerRequest(
            question="How do I deploy?",
            organization_id=999,
            visitor_id="visitor-identifier-1234",
        )
        with patch("app.api.answers.reserve_chat_request") as reserve, patch(
            "app.api.answers.retrieve_passages"
        ) as retrieve:
            with self.assertRaises(HTTPException) as raised:
                answer_question(request, db=object())

        self.assertEqual(raised.exception.status_code, 403)
        reserve.assert_not_called()
        retrieve.assert_not_called()

    def test_chat_quota_exhaustion_returns_retryable_rate_limit(self):
        request = AnswerRequest(
            question="How do I deploy?",
            organization_id=1,
            visitor_id="visitor-identifier-1234",
        )
        with patch(
            "app.api.answers.reserve_chat_request",
            side_effect=ChatQuotaExceeded("visitor", 10),
        ), patch("app.api.answers.seconds_until_quota_reset", return_value=3600):
            with self.assertRaises(HTTPException) as raised:
                answer_question(request, db=object())

        self.assertEqual(raised.exception.status_code, 429)
        self.assertEqual(raised.exception.headers["Retry-After"], "3600")
        self.assertEqual(raised.exception.detail["scope"], "visitor")

    def test_chat_journey_reserves_quota_retrieves_sources_and_returns_answer(self):
        request = AnswerRequest(
            question="  How do I deploy?  ",
            organization_id=1,
            visitor_id="visitor-identifier-1234",
            top_k=3,
        )
        passages = [{"citation": 1, "document_id": 4, "filename": "guide.pdf", "page_number": 2, "passage": "Deploy safely."}]
        with patch("app.api.answers.reserve_chat_request") as reserve, patch(
            "app.api.answers.retrieve_passages", return_value=passages
        ) as retrieve, patch("app.api.answers.generate_answer", return_value="Use the deployment guide.") as generate:
            result = answer_question(request, db="test-db")

        reserve.assert_called_once_with("test-db", request.visitor_id)
        retrieve.assert_called_once_with(
            db="test-db", question="How do I deploy?", organization_id=1, top_k=3
        )
        generate.assert_called_once_with("How do I deploy?", passages)
        self.assertEqual(result.answer, "Use the deployment guide.")
        self.assertEqual(result.sources[0].filename, "guide.pdf")


if __name__ == "__main__":
    unittest.main()
