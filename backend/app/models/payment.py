from sqlalchemy import Column, Integer, String, DateTime, Numeric, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Payment(Base):
    __tablename__ = "payments"

    id = Column(Integer, primary_key=True, index=True)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    payment_method_id = Column(Integer, ForeignKey("payment_methods.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    paid_at = Column(DateTime(timezone=True), server_default=func.now())
    status = Column(String, default="completed")  # pending, completed, failed
    notes = Column(String, nullable=True)

    account = relationship("Account", back_populates="payments")
    payment_method = relationship("PaymentMethod", back_populates="payments")
