from pydantic import BaseModel
from datetime import date, datetime
from typing import Optional


class BillResponse(BaseModel):
    id: int
    account_id: int
    external_id: str
    amount_cents: int
    currency: str
    due_date: date
    status: str
    fetched_at: datetime
    paid_at: Optional[datetime] = None

    class Config:
        from_attributes = True
