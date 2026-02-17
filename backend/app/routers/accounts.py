import re
import threading
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models.account import Account
from ..models.task import Task
from ..schemas.account import AccountCreate, AccountUpdate, AccountResponse
from ..services.driver_runner import driver_exists


def generate_driver_name(name: str) -> str:
    result = name.lower()
    result = re.sub(r"[^a-z0-9]+", "_", result)
    result = result.strip("_")
    return result

router = APIRouter(prefix="/accounts", tags=["accounts"])


@router.get("/", response_model=List[AccountResponse])
def list_accounts(db: Session = Depends(get_db)):
    return db.query(Account).all()


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    return account


@router.post("/", response_model=AccountResponse)
def create_account(account: AccountCreate, db: Session = Depends(get_db)):
    data = account.model_dump()
    if not data.get("driver_name"):
        data["driver_name"] = generate_driver_name(data["name"])
    db_account = Account(**data)
    db.add(db_account)
    db.commit()
    db.refresh(db_account)
    return db_account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(account_id: int, account: AccountUpdate, db: Session = Depends(get_db)):
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    update_data = account.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_account, field, value)

    db.commit()
    db.refresh(db_account)
    return db_account


@router.delete("/{account_id}")
def delete_account(account_id: int, db: Session = Depends(get_db)):
    db_account = db.query(Account).filter(Account.id == account_id).first()
    if not db_account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")

    db.delete(db_account)
    db.commit()
    return {"message": "Cuenta eliminada"}


@router.post("/{account_id}/sync")
def sync_account(account_id: int, db: Session = Depends(get_db)):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Cuenta no encontrada")
    if not account.driver_name or not driver_exists(account.driver_name):
        raise HTTPException(status_code=400, detail="No hay driver disponible para esta cuenta")

    task_id = str(uuid.uuid4())
    task = Task(
        id=task_id,
        type="sync",
        status="pending",
        account_id=account_id,
    )
    db.add(task)
    db.commit()

    from .bills import _run_sync_task
    thread = threading.Thread(target=_run_sync_task, args=(task_id, account_id))
    thread.start()

    return {"task_id": task_id}
