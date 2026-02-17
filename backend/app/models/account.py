from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from ..database import Base


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    frequency = Column(String, default="monthly")  # monthly, bimonthly, quarterly, etc.
    website_url = Column(String, nullable=True)
    driver_name = Column(String, nullable=True)
    identifiers = Column(JSON, default=dict)  # {"numero_cliente": "123", ...}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    payments = relationship("Payment", back_populates="account")
    bills = relationship("Bill", back_populates="account")
