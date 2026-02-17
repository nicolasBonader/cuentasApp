from sqlalchemy import Column, Integer, String, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func

from ..database import Base


class Task(Base):
    __tablename__ = "tasks"

    id = Column(String, primary_key=True)  # UUID
    type = Column(String, nullable=False)  # sync, pay
    status = Column(String, default="pending")  # pending, running, completed, failed
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    bill_id = Column(Integer, ForeignKey("bills.id"), nullable=True)
    result = Column(JSON, nullable=True)
    error = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    finished_at = Column(DateTime(timezone=True), nullable=True)
