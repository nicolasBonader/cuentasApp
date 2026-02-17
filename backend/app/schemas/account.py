from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class AccountBase(BaseModel):
    name: str
    frequency: str = "monthly"
    website_url: Optional[str] = None
    driver_name: Optional[str] = None
    identifiers: dict = {}


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    frequency: Optional[str] = None
    website_url: Optional[str] = None
    driver_name: Optional[str] = None
    identifiers: Optional[dict] = None


class AccountResponse(AccountBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
