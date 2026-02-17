# Driver Specification

A driver is a standalone Python script that automates interactions with a specific service provider (e.g., a utility company website) to fetch bills, pay them, or retrieve payment history.

Drivers live in `backend/drivers/` and are matched to accounts by the `driver_name` column on the `Account` model.

---

## File Format

Every driver must be a self-contained Python script with inline `uv` metadata so it can run standalone without a virtual environment:

```python
#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "playwright",
#     "playwright-recaptcha",
# ]
# ///

import sys
import json
import os

# ... driver implementation ...
```

The shebang + inline metadata allows the script to be executed directly:

```bash
uv run drivers/ecogas.py fetch
```

---

## Commands

Every driver must accept exactly one of the following commands as its first CLI argument:

### `fetch`

Returns a list of currently available (unpaid) bills.

```bash
uv run drivers/ecogas.py fetch
```

**Output:**

```json
{
    "errors": [],
    "bills": [
        {
            "id": "unique-bill-identifier",
            "amountCents": 15000,
            "currency": "ARS",
            "dueDate": "2026-03-01",
            "status": "UNPAID"
        }
    ]
}
```

### `pay <bill_id>`

Pays a specific bill. The bill ID (from a previous `fetch`) is passed as the second CLI argument.

```bash
uv run drivers/ecogas.py pay unique-bill-identifier
```

**Output:**

```json
{
    "errors": [],
    "bill": {
        "id": "unique-bill-identifier",
        "amountCents": 15000,
        "currency": "ARS",
        "dueDate": "2026-03-01",
        "status": "PAID"
    }
}
```

### `history`

Returns a list of previously paid bills.

```bash
uv run drivers/ecogas.py history
```

**Output:**

```json
{
    "errors": [],
    "bills": [
        {
            "id": "unique-bill-identifier",
            "amountCents": 15000,
            "currency": "ARS",
            "dueDate": "2026-02-01",
            "status": "PAID"
        }
    ]
}
```

---

## Output Format

All commands must print a single JSON object to **stdout** and exit with code 0 on success.

### Bill Object

| Field        | Type   | Description                             |
|--------------|--------|-----------------------------------------|
| `id`         | string | Unique identifier for this bill         |
| `amountCents` | int   | Amount to pay in cents (e.g., 15000 = $150.00) |
| `currency`   | string | ISO 4217 currency code (e.g., `"ARS"`) |
| `dueDate`    | string | Due date in `YYYY-MM-DD` format         |
| `status`     | string | `"UNPAID"` or `"PAID"`                  |

### Error Handling

If something goes wrong, the driver should still output valid JSON with the `errors` array populated:

```json
{
    "errors": ["No se pudo conectar al sitio web"],
    "bills": []
}
```

The exit code should be **1** if the command failed entirely (couldn't connect, credentials invalid, etc.). The exit code should be **0** if the command succeeded, even if there are non-fatal warnings in `errors`.

If a command is not supported (e.g., the service doesn't allow online payment), return:

```json
{
    "errors": ["Comando 'pay' no soportado para este servicio"],
    "bills": []
}
```

---

## Environment Variables

Drivers receive all their inputs through environment variables. **No account-specific data is passed via CLI arguments.**

### Identifiers

The backend passes all key-value pairs from `account.identifiers` as uppercased environment variables. For example, if the account has:

```json
{
    "numero_cuenta": "20441802",
    "nic": "ABC123"
}
```

The driver process receives:

- `NUMERO_CUENTA=20441802`
- `NIC=ABC123`

### Required Identifiers Validation

Every driver **must** validate at startup that all identifiers it needs are present. If any are missing, the driver should exit immediately with an error:

```python
import os
import sys
import json

def require_env(*names):
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        result = {
            "errors": [f"Faltan variables de entorno requeridas: {', '.join(missing)}"],
            "bills": []
        }
        print(json.dumps(result))
        sys.exit(1)

# At the top of the driver, before doing anything:
require_env("NUMERO_CUENTA")
```

### Payment Card Variables

These are only provided when the backend calls the `pay` command. They are **not** available during `fetch` or `history`.

| Variable         | Description                    | Example          |
|------------------|--------------------------------|------------------|
| `CARD_NUMBER`    | Full card number (PAN)         | `4111111111111111`|
| `CARD_EXP_MONTH` | Expiration month, zero-padded | `03`             |
| `CARD_EXP_YEAR`  | Expiration year, 4 digits     | `2028`           |
| `CARD_CVV`       | Card verification value        | `123`            |

Drivers that support `pay` should validate these the same way:

```python
if command == "pay":
    require_env("CARD_NUMBER", "CARD_EXP_MONTH", "CARD_EXP_YEAR", "CARD_CVV")
```

---

## CLI Structure

```
usage: driver.py <command> [bill_id]

commands:
    fetch       Fetch available unpaid bills
    pay ID      Pay a specific bill by ID
    history     List previously paid bills
```

Minimal `__main__` block:

```python
if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"errors": ["Uso: driver.py <fetch|pay|history> [bill_id]"], "bills": []}))
        sys.exit(1)

    command = sys.argv[1]

    if command == "fetch":
        result = fetch()
    elif command == "pay":
        if len(sys.argv) < 3:
            print(json.dumps({"errors": ["Uso: driver.py pay <bill_id>"], "bills": []}))
            sys.exit(1)
        bill_id = sys.argv[2]
        result = pay(bill_id)
    elif command == "history":
        result = history()
    else:
        result = {"errors": [f"Comando desconocido: {command}"], "bills": []}

    print(json.dumps(result))
```

---

## Logging & Debugging

- All user-facing output (the JSON result) goes to **stdout**.
- Debugging/progress messages should go to **stderr** so they don't interfere with JSON parsing:

```python
import sys

def log(msg):
    print(msg, file=sys.stderr)

log("[*] Navigating to ecogas.com.ar...")
```

---

## Testing a Driver

You can test a driver manually by setting the required environment variables and running it:

```bash
NUMERO_CUENTA=20441802 uv run drivers/ecogas.py fetch
```

For `pay`:

```bash
NUMERO_CUENTA=20441802 \
CARD_NUMBER=4111111111111111 \
CARD_EXP_MONTH=03 \
CARD_EXP_YEAR=2028 \
CARD_CVV=123 \
uv run drivers/ecogas.py pay some-bill-id
```

---

## Checklist for New Drivers

- [ ] File is in `backend/drivers/` with a descriptive name (e.g., `ecogas.py`)
- [ ] Has `#!/usr/bin/env -S uv run` shebang and inline dependency metadata
- [ ] Implements all three commands: `fetch`, `pay`, `history`
- [ ] All output is valid JSON printed to stdout
- [ ] Validates required environment variables at startup with clear error messages
- [ ] Logs debug info to stderr, not stdout
- [ ] Works standalone: `uv run drivers/name.py fetch` with env vars set
- [ ] Unsupported commands return a clear error, not a crash
