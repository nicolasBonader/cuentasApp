import threading
import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import List, Optional

from ..database import get_db, SessionLocal
from ..models.account import Account
from ..models.bill import Bill
from ..models.payment import Payment
from ..models.payment_method import PaymentMethod
from ..models.task import Task
from ..schemas.bill import BillResponse
from ..services.driver_runner import run_driver, driver_exists

router = APIRouter(prefix="/bills", tags=["bills"])


@router.get("/", response_model=List[BillResponse])
def list_bills(
    account_id: Optional[int] = Query(None),
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    query = db.query(Bill)
    if account_id is not None:
        query = query.filter(Bill.account_id == account_id)
    if status is not None:
        query = query.filter(Bill.status == status)
    return query.order_by(Bill.due_date.desc()).all()


@router.get("/{bill_id}", response_model=BillResponse)
def get_bill(bill_id: int, db: Session = Depends(get_db)):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Factura no encontrada")
    return bill


def _run_sync_task(task_id: str, account_id: int):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        task.status = "running"
        db.commit()

        account = db.query(Account).filter(Account.id == account_id).first()
        result = run_driver(account.driver_name, "fetch", account.identifiers)

        if result.get("errors"):
            task.status = "failed"
            task.error = "; ".join(result["errors"])
        else:
            for bill_data in result.get("bills", []):
                existing = db.query(Bill).filter(
                    Bill.account_id == account_id,
                    Bill.external_id == bill_data["id"],
                ).first()
                if existing:
                    existing.amount_cents = bill_data["amountCents"]
                    existing.currency = bill_data.get("currency", "ARS")
                    existing.due_date = date.fromisoformat(bill_data["dueDate"])
                    existing.status = bill_data["status"]
                else:
                    db.add(Bill(
                        account_id=account_id,
                        external_id=bill_data["id"],
                        amount_cents=bill_data["amountCents"],
                        currency=bill_data.get("currency", "ARS"),
                        due_date=date.fromisoformat(bill_data["dueDate"]),
                        status=bill_data["status"],
                    ))
            task.status = "completed"

        task.result = result
        task.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = "failed"
            task.error = str(e)
            task.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


def _run_pay_task(task_id: str, bill_id: int, payment_method_id: Optional[int]):
    db = SessionLocal()
    try:
        task = db.query(Task).filter(Task.id == task_id).first()
        task.status = "running"
        db.commit()

        bill = db.query(Bill).filter(Bill.id == bill_id).first()
        account = db.query(Account).filter(Account.id == bill.account_id).first()

        encrypted_card = None
        if payment_method_id:
            pm = db.query(PaymentMethod).filter(PaymentMethod.id == payment_method_id).first()
            if pm:
                encrypted_card = pm.encrypted_data

        result = run_driver(
            account.driver_name, "pay", account.identifiers,
            bill_id=bill.external_id,
            encrypted_card=encrypted_card,
        )

        if result.get("errors"):
            task.status = "failed"
            task.error = "; ".join(result["errors"])
        else:
            bill_data = result.get("bill", {})
            if bill_data.get("status") == "PAID":
                bill.status = "PAID"
                bill.paid_at = datetime.now(timezone.utc)
                db.add(Payment(
                    account_id=bill.account_id,
                    payment_method_id=payment_method_id,
                    bill_id=bill.id,
                    amount=bill.amount_cents / 100,
                    status="completed",
                ))
            task.status = "completed"

        task.result = result
        task.finished_at = datetime.now(timezone.utc)
        db.commit()
    except Exception as e:
        task = db.query(Task).filter(Task.id == task_id).first()
        if task:
            task.status = "failed"
            task.error = str(e)
            task.finished_at = datetime.now(timezone.utc)
            db.commit()
    finally:
        db.close()


@router.post("/{bill_id}/pay")
def pay_bill(
    bill_id: int,
    payment_method_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
):
    bill = db.query(Bill).filter(Bill.id == bill_id).first()
    if not bill:
        raise HTTPException(status_code=404, detail="Factura no encontrada")

    account = db.query(Account).filter(Account.id == bill.account_id).first()
    if not account.driver_name or not driver_exists(account.driver_name):
        raise HTTPException(status_code=400, detail="No hay driver disponible para esta cuenta")

    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        type="pay",
        status="pending",
        account_id=account.id,
        bill_id=bill_id,
    )
    db.add(task)
    db.commit()

    thread = threading.Thread(target=_run_pay_task, args=(task_id, bill_id, payment_method_id))
    thread.start()

    return {"task_id": task_id}
