from pydantic import BaseModel
from datetime import datetime
from typing import Optional


class PaymentMethodBase(BaseModel):
    name: str
    card_type: str  # "credit" or "debit"


class PaymentMethodCreate(PaymentMethodBase):
    card_number: str
    expiry_date: str  # MM/YY
    cvv: str


class PaymentMethodUpdate(BaseModel):
    name: Optional[str] = None


class PaymentMethodResponse(PaymentMethodBase):
    id: int
    last_four_digits: str
    created_at: datetime

    class Config:
        from_attributes = True
