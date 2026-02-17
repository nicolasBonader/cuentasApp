from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.payment_method import PaymentMethod
from ..schemas.payment_method import PaymentMethodCreate, PaymentMethodUpdate, PaymentMethodResponse
from ..services.encryption import encrypt_card_data

router = APIRouter(prefix="/payment-methods", tags=["payment_methods"])


@router.get("/", response_model=List[PaymentMethodResponse])
def list_payment_methods(db: Session = Depends(get_db)):
    return db.query(PaymentMethod).all()


@router.get("/{method_id}", response_model=PaymentMethodResponse)
def get_payment_method(method_id: int, db: Session = Depends(get_db)):
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Medio de pago no encontrado")
    return method


@router.post("/", response_model=PaymentMethodResponse)
def create_payment_method(data: PaymentMethodCreate, db: Session = Depends(get_db)):
    # Extract last 4 digits before encrypting
    last_four = data.card_number[-4:]

    # Encrypt sensitive card data
    encrypted = encrypt_card_data(
        card_number=data.card_number,
        expiry_date=data.expiry_date,
        cvv=data.cvv
    )

    db_method = PaymentMethod(
        name=data.name,
        card_type=data.card_type,
        last_four_digits=last_four,
        encrypted_data=encrypted
    )
    db.add(db_method)
    db.commit()
    db.refresh(db_method)
    return db_method


@router.put("/{method_id}", response_model=PaymentMethodResponse)
def update_payment_method(method_id: int, data: PaymentMethodUpdate, db: Session = Depends(get_db)):
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Medio de pago no encontrado")

    if data.name is not None:
        method.name = data.name

    db.commit()
    db.refresh(method)
    return method


@router.delete("/{method_id}")
def delete_payment_method(method_id: int, db: Session = Depends(get_db)):
    method = db.query(PaymentMethod).filter(PaymentMethod.id == method_id).first()
    if not method:
        raise HTTPException(status_code=404, detail="Medio de pago no encontrado")

    db.delete(method)
    db.commit()
    return {"message": "Medio de pago eliminado"}
