from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import hash_password, verify_password
from app.models.user import User


def authenticate_user(
    db: Session,
    email: str,
    password: str,
) -> User | None:
    user = db.query(User).filter(User.email == email).first()

    if user is None:
        return None

    if not verify_password(password, user.password_hash):
        return None

    return user


def register_customer(
    db: Session,
    *,
    email: str,
    password: str,
    organization_id: int,
) -> User | None:
    existing_user = db.scalar(select(User).where(User.email == email))
    if existing_user is not None:
        return None

    customer = User(
        organization_id=organization_id,
        email=email,
        password_hash=hash_password(password),
        role="customer",
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    return customer
