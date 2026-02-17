import json
from cryptography.fernet import Fernet

from ..config import get_settings


def get_fernet() -> Fernet:
    settings = get_settings()
    if not settings.card_encryption_key:
        raise ValueError("CARD_ENCRYPTION_KEY not configured")
    return Fernet(settings.card_encryption_key.encode())


def encrypt_card_data(card_number: str, expiry_date: str, cvv: str) -> bytes:
    """Encrypt sensitive card data."""
    fernet = get_fernet()
    data = json.dumps({
        "card_number": card_number,
        "expiry_date": expiry_date,
        "cvv": cvv
    })
    return fernet.encrypt(data.encode())


def decrypt_card_data(encrypted_data: bytes) -> dict:
    """Decrypt card data. Returns dict with card_number, expiry_date, cvv."""
    fernet = get_fernet()
    decrypted = fernet.decrypt(encrypted_data)
    return json.loads(decrypted.decode())


def generate_encryption_key() -> str:
    """Generate a new Fernet key. Use this once to create your CARD_ENCRYPTION_KEY."""
    return Fernet.generate_key().decode()
