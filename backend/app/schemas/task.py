from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Any


class TaskResponse(BaseModel):
    id: str
    type: str
    status: str
    account_id: int
    bill_id: Optional[int] = None
    result: Optional[Any] = None
    error: Optional[str] = None
    created_at: datetime
    finished_at: Optional[datetime] = None

    class Config:
        from_attributes = True
