"""add suggested question bank

Revision ID: d10f4c8a91b2
Revises: c4a7d1e92b60
Create Date: 2026-10-30

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "d10f4c8a91b2"
down_revision: Union[str, Sequence[str], None] = "c4a7d1e92b60"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


QUESTIONS = [
    "How do I deploy my first CloudForge CDK service safely, from setup through verification?",
    "Which rollout strategy should I use, and what health signals mean I should pause or roll back?",
    "How do I safely review a preview environment and verify a custom domain and HTTPS before sharing it?",
    "How do I connect my repository and configure a build for a new CloudForge service?",
    "What is the safest way to manage environment variables and secrets for my app?",
    "How can I troubleshoot a deployment that failed during the build or release step?",
    "How do I add a staging environment and promote a tested release to production?",
    "How can I check logs and diagnose why my deployed service is returning errors?",
    "How do I configure a custom domain and make sure DNS is set up correctly?",
    "What should I check before rolling back a production deployment?",
    "How do I scale a service when traffic increases, and how can I monitor its health?",
    "How do I connect my service to a database without exposing its credentials?",
    "How can I set up alerts so I know when my service becomes unhealthy?",
    "What should I do if my deployment is healthy but the app is still unreachable?",
    "How do I review deployment history and find out which version is currently live?",
]


def upgrade() -> None:
    op.create_table(
        "suggested_questions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("question", sa.String(length=500), nullable=False),
        sa.Column("active", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("question"),
    )
    questions = sa.table(
        "suggested_questions",
        sa.column("question", sa.String),
        sa.column("active", sa.Boolean),
    )
    op.bulk_insert(questions, [{"question": question, "active": True} for question in QUESTIONS])


def downgrade() -> None:
    op.drop_table("suggested_questions")
