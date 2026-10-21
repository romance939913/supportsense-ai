"""add daily chat quota counters

Revision ID: c4a7d1e92b60
Revises: 812850ea9c64
Create Date: 2026-10-20

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c4a7d1e92b60"
down_revision: Union[str, Sequence[str], None] = "812850ea9c64"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "chat_quotas",
        sa.Column("quota_date", sa.Date(), nullable=False),
        sa.Column("scope", sa.String(length=16), nullable=False),
        sa.Column("quota_key", sa.String(length=64), nullable=False),
        sa.Column("request_count", sa.Integer(), nullable=False),
        sa.PrimaryKeyConstraint(
            "quota_date",
            "scope",
            "quota_key",
            name="pk_chat_quotas",
        ),
    )


def downgrade() -> None:
    op.drop_table("chat_quotas")
