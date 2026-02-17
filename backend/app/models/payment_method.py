from sqlalchemy import Column, Integer, String, DateTime, LargeBinary
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class PaymentMethod(Base):
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)  # "Visa terminada en 1234"
    card_type = Column(String, nullable=False)  # "credit" or "debit"
    last_four_digits = Column(String(4), nullable=False)
    encrypted_data = Column(LargeBinary, nullable=False)  # Encrypted card data
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    payments = relationship("Payment", back_populates="payment_method")
