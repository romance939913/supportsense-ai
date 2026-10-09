"""add organizations and document ownership

Revision ID: b46c3915a868
Revises: f32fba7ec72c
Create Date: 2026-10-07 20:20:48.359642

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'b46c3915a868'
down_revision: Union[str, Sequence[str], None] = 'f32fba7ec72c'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade():
    # 1. Create organizations table
    op.create_table(
        "organizations",
        sa.Column(
            "id",
            sa.Integer(),
            autoincrement=True,
            nullable=False,
        ),
        sa.Column(
            "name",
            sa.String(length=255),
            nullable=False,
        ),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    # 2. Add organization_id to users as nullable temporarily
    op.add_column(
        "users",
        sa.Column(
            "organization_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_users_organization_id",
        "users",
        ["organization_id"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_users_organization_id",
        "users",
        "organizations",
        ["organization_id"],
        ["id"],
    )

    # 3. Add organization_id and uploaded_by to documents
    op.add_column(
        "documents",
        sa.Column(
            "organization_id",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.add_column(
        "documents",
        sa.Column(
            "uploaded_by",
            sa.Integer(),
            nullable=True,
        ),
    )

    op.create_index(
        "ix_documents_organization_id",
        "documents",
        ["organization_id"],
        unique=False,
    )

    op.create_index(
        "ix_documents_uploaded_by",
        "documents",
        ["uploaded_by"],
        unique=False,
    )

    op.create_foreign_key(
        "fk_documents_organization_id",
        "documents",
        "organizations",
        ["organization_id"],
        ["id"],
    )

    op.create_foreign_key(
        "fk_documents_uploaded_by",
        "documents",
        "users",
        ["uploaded_by"],
        ["id"],
    )

    # 4. Create CloudForge organization
    op.execute(
        """
        INSERT INTO organizations (name)
        VALUES ('CloudForge')
        """
    )

    # 5. Assign existing users to CloudForge
    op.execute(
        """
        UPDATE users
        SET organization_id = (
            SELECT id
            FROM organizations
            WHERE name = 'CloudForge'
        )
        """
    )

    # 6. Existing documents were uploaded by the existing admin.
    op.execute(
        """
        UPDATE documents
        SET organization_id = (
            SELECT id
            FROM organizations
            WHERE name = 'CloudForge'
        ),
        uploaded_by = (
            SELECT id
            FROM users
            ORDER BY id
            LIMIT 1
        )
        """
    )

    # 7. Make ownership required
    op.alter_column(
        "users",
        "organization_id",
        nullable=False,
    )

    op.alter_column(
        "documents",
        "organization_id",
        nullable=False,
    )

    op.alter_column(
        "documents",
        "uploaded_by",
        nullable=False,
    )


def downgrade():
    op.drop_constraint(
        "fk_documents_uploaded_by",
        "documents",
        type_="foreignkey",
    )

    op.drop_constraint(
        "fk_documents_organization_id",
        "documents",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_documents_uploaded_by",
        table_name="documents",
    )

    op.drop_index(
        "ix_documents_organization_id",
        table_name="documents",
    )

    op.drop_column(
        "documents",
        "uploaded_by",
    )

    op.drop_column(
        "documents",
        "organization_id",
    )

    op.drop_constraint(
        "fk_users_organization_id",
        "users",
        type_="foreignkey",
    )

    op.drop_index(
        "ix_users_organization_id",
        table_name="users",
    )

    op.drop_column(
        "users",
        "organization_id",
    )

    op.drop_table("organizations")
