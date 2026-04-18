from typing import Optional

from pydantic import BaseModel, ConfigDict, Field

ROLE_SUPER_ADMIN = "super_admin"
ROLE_EDITOR = "editor"
VALID_ROLES = [ROLE_SUPER_ADMIN, ROLE_EDITOR]


class AdminBase(BaseModel):
    username: str


class AdminCreate(AdminBase):
    password: str = Field(..., min_length=6)
    role: str = ROLE_EDITOR


class AdminUpdate(BaseModel):
    username: Optional[str] = None
    password: Optional[str] = Field(None, min_length=6)
    role: Optional[str] = None


class AdminLogin(BaseModel):
    username: str
    password: str


class AdminResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    username: str
    role: str = ROLE_SUPER_ADMIN
    created_at: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    admin: AdminResponse


class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=6)
