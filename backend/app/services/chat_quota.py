from datetime import datetime, time, timedelta, timezone
from hashlib import sha256
import hmac

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.chat_quota import ChatQuota


class ChatQuotaExceeded(Exception):
    def __init__(self, scope: str, limit: int):
        self.scope = scope
        self.limit = limit


def _visitor_key(visitor_id: str) -> str:
    digest = hmac.new(
        settings.jwt_secret_key.encode(),
        visitor_id.encode(),
        sha256,
    )
    return digest.hexdigest()


def _increment_within_limit(
    db: Session,
    *,
    quota_date,
    scope: str,
    quota_key: str,
    limit: int,
) -> bool:
    table = ChatQuota.__table__
    statement = insert(ChatQuota).values(
        quota_date=quota_date,
        scope=scope,
        quota_key=quota_key,
        request_count=1,
    )
    statement = statement.on_conflict_do_update(
        index_elements=[table.c.quota_date, table.c.scope, table.c.quota_key],
        set_={"request_count": table.c.request_count + 1},
        where=table.c.request_count < limit,
    ).returning(table.c.request_count)

    return db.execute(statement).scalar_one_or_none() is not None


def reserve_chat_request(db: Session, visitor_id: str) -> None:
    """Atomically reserve one visitor and global daily chat slot."""
    now = datetime.now(timezone.utc)
    quota_date = now.date()
    reservations = (
        (
            "visitor",
            _visitor_key(visitor_id),
            settings.daily_chat_limit_per_visitor,
        ),
        ("global", "all", settings.daily_chat_limit_global),
    )

    try:
        for scope, quota_key, limit in reservations:
            if not _increment_within_limit(
                db,
                quota_date=quota_date,
                scope=scope,
                quota_key=quota_key,
                limit=limit,
            ):
                db.rollback()
                raise ChatQuotaExceeded(scope, limit)
        db.commit()
    except ChatQuotaExceeded:
        raise
    except Exception:
        db.rollback()
        raise


def seconds_until_quota_reset() -> int:
    now = datetime.now(timezone.utc)
    tomorrow = now.date() + timedelta(days=1)
    reset_at = datetime.combine(tomorrow, time.min, tzinfo=timezone.utc)
    return max(1, int((reset_at - now).total_seconds()))
