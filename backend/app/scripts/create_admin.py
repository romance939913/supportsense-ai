from getpass import getpass

from sqlalchemy import select

from app.db.database import SessionLocal
from app.models.user import User
from app.security import hash_password


def main():
    email = input("Admin email: ").strip().lower()
    password = getpass("Admin password: ")
    password_confirmation = getpass("Confirm password: ")

    if not email:
        print("Error: email cannot be empty.")
        return

    if not password:
        print("Error: password cannot be empty.")
        return

    if password != password_confirmation:
        print("Error: passwords do not match.")
        return

    with SessionLocal() as db:
        existing_user = db.scalar(
            select(User).where(User.email == email)
        )

        if existing_user:
            print(f"Error: a user with email '{email}' already exists.")
            return

        user = User(
            email=email,
            password_hash=hash_password(password),
            role="support_admin",
        )

        db.add(user)
        db.commit()
        db.refresh(user)

        print()
        print("Support Admin created successfully!")
        print(f"ID: {user.id}")
        print(f"Email: {user.email}")
        print(f"Role: {user.role}")


if __name__ == "__main__":
    main()