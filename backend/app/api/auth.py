from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.db.database import get_db
from app.services.auth_service import authenticate_user, register_customer
from app.api.dependencies import get_current_user
from app.models.user import User
from app.schemas.auth import CustomerSignupRequest, CustomerSignupResponse

router = APIRouter(
    prefix="/auth",
    tags=["auth"],
)


@router.post(
    "/register",
    response_model=CustomerSignupResponse,
    status_code=status.HTTP_201_CREATED,
)
def register(
    request: CustomerSignupRequest,
    db: Session = Depends(get_db),
):
    email = str(request.email).lower()

    try:
        customer = register_customer(
            db=db,
            email=email,
            password=request.password,
            organization_id=request.organization_id,
        )
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="organization_id must reference an existing organization and the email must be unique.",
        ) from exc

    if customer is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    return CustomerSignupResponse(
        id=customer.id,
        email=customer.email,
        organization_id=customer.organization_id,
        role="customer",
    )


@router.post("/login")
def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db),
):
    user = authenticate_user(
        db=db,
        email=form_data.username,
        password=form_data.password,
    )

    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
    )

    access_token = create_access_token(
        data={
            "sub": str(user.id),
            "role": user.role,
        }
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get("/me")
def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "role": current_user.role,
    }
