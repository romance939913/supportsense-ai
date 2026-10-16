from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class CustomerSignupRequest(BaseModel):
    organization_id: int = Field(gt=0)
    email: EmailStr
    password: str = Field(min_length=8, max_length=72)


class CustomerSignupResponse(BaseModel):
    id: int
    email: EmailStr
    organization_id: int
    role: Literal["customer"]
