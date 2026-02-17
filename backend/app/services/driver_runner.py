import json
import os
import subprocess
from pathlib import Path

from ..services.encryption import decrypt_card_data

DRIVERS_DIR = Path(__file__).resolve().parent.parent.parent / "drivers"


def driver_exists(driver_name: str) -> bool:
    return (DRIVERS_DIR / f"{driver_name}.py").is_file()


def build_env(identifiers: dict, card_data: dict | None = None) -> dict:
    env = {**os.environ}
    for key, value in identifiers.items():
        env[key.upper()] = str(value)
    if card_data:
        env["CARD_NUMBER"] = card_data["card_number"]
        exp_parts = card_data["expiry_date"].split("/")
        env["CARD_EXP_MONTH"] = exp_parts[0].zfill(2)
        env["CARD_EXP_YEAR"] = f"20{exp_parts[1]}" if len(exp_parts[1]) == 2 else exp_parts[1]
        env["CARD_CVV"] = card_data["cvv"]
    return env


def run_driver(driver_name: str, command: str, identifiers: dict,
               bill_id: str | None = None,
               encrypted_card: bytes | None = None) -> dict:
    script = DRIVERS_DIR / f"{driver_name}.py"
    if not script.is_file():
        return {"errors": [f"Driver '{driver_name}' no encontrado"], "bills": []}

    card_data = None
    if encrypted_card and command == "pay":
        card_data = decrypt_card_data(encrypted_card)

    env = build_env(identifiers, card_data)

    args = ["uv", "run", str(script), command]
    if bill_id and command == "pay":
        args.append(bill_id)

    try:
        result = subprocess.run(
            args,
            capture_output=True,
            text=True,
            timeout=120,
            env=env,
        )
    except subprocess.TimeoutExpired:
        return {"errors": ["El driver excedió el tiempo límite (120s)"], "bills": []}

    if result.returncode != 0 and not result.stdout.strip():
        stderr_msg = result.stderr.strip()[:500] if result.stderr else "Error desconocido"
        return {"errors": [f"Driver falló (exit {result.returncode}): {stderr_msg}"], "bills": []}

    try:
        return json.loads(result.stdout)
    except json.JSONDecodeError:
        return {"errors": [f"Respuesta inválida del driver: {result.stdout[:200]}"], "bills": []}
