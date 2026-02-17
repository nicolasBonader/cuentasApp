from pydantic import BaseModel
from datetime import datetime
from typing import Optional
from decimal import Decimal


class PaymentBase(BaseModel):
    account_id: int
    payment_method_id: Optional[int] = None
    amount: Decimal
    notes: Optional[str] = None


class PaymentCreate(PaymentBase):
    paid_at: Optional[datetime] = None  # Si no se especifica, usa timestamp actual


class PaymentResponse(PaymentBase):
    id: int
    paid_at: datetime
    status: str

    class Config:
        from_attributes = True
