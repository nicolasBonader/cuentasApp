from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db
from ..models.payment import Payment
from ..models.account import Account
from ..schemas.payment import PaymentCreate, PaymentResponse

router = APIRouter(prefix="/payments", tags=["payments"])


@router.get("/", response_model=List[PaymentResponse])
def list_payments(account_id: Optional[int] = None, db: Session = Depends(get_db)):
    query = db.query(Payment)
    if account_id:
        query = query.filter(Payment.account_id == account_id)
    return query.order_by(Payment.paid_at.desc()).all()


@router.get("/{payment_id}", response_model=PaymentResponse)
def get_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")
    return payment


@router.post("/", response_model=PaymentResponse)
def create_payment(data: PaymentCreate, db: Session = Depends(get_db)):
    # Verify account exists
    account = db.query(Account).filter(Account.id == data.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    payment_data = data.model_dump(exclude_unset=True)
    # Si no se especificó paid_at, no lo incluimos para que use el default del modelo
    if data.paid_at is None:
        payment_data.pop("paid_at", None)

    db_payment = Payment(**payment_data)
    db.add(db_payment)
    db.commit()
    db.refresh(db_payment)
    return db_payment


@router.delete("/{payment_id}")
def delete_payment(payment_id: int, db: Session = Depends(get_db)):
    payment = db.query(Payment).filter(Payment.id == payment_id).first()
    if not payment:
        raise HTTPException(status_code=404, detail="Pago no encontrado")

    db.delete(payment)
    db.commit()
    return {"message": "Pago eliminado"}
