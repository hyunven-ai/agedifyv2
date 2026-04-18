from pydantic import BaseModel, ConfigDict, EmailStr
from typing import Optional


class ContactBase(BaseModel):
    name: str
    email: EmailStr
    message: str


class ContactCreate(ContactBase):
    pass


class ContactResponse(ContactBase):
    model_config = ConfigDict(extra="ignore")
    id: str
    status: str
    created_at: str


class ContactUpdate(BaseModel):
    status: Optional[str] = None
