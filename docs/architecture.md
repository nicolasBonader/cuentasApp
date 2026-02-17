# Architecture

Cuentas App is a personal web app to manage and pay utility bills. No authentication system — it runs locally.

## Stack

| Layer    | Technology                           |
|----------|--------------------------------------|
| Backend  | FastAPI, SQLAlchemy, SQLite, Pydantic v2 |
| Frontend | React 18, Vite, plain JSX            |
| Drivers  | Standalone Python scripts (Playwright) |
| Packages | `uv` (backend), `npm` (frontend)    |
| Migrations | Alembic (batch mode for SQLite)    |

## Project Structure

```
cuentasApp/
├── backend/
│   ├── app/
│   │   ├── main.py                  # FastAPI entrypoint, CORS, router registration
│   │   ├── config.py                # pydantic-settings (DATABASE_URL, CARD_ENCRYPTION_KEY)
│   │   ├── database.py              # Engine, SessionLocal, Base, get_db()
│   │   ├── models/
│   │   │   ├── account.py           # Account (name, frequency, driver_name, identifiers JSON)
│   │   │   ├── bill.py              # Bill (external_id, amount_cents, currency, due_date, status)
│   │   │   ├── payment.py           # Payment (amount, paid_at, status, optional bill_id)
│   │   │   ├── payment_method.py    # PaymentMethod (encrypted card data, last_four_digits)
│   │   │   └── task.py              # Task (UUID, type, status, result JSON, error)
│   │   ├── schemas/                 # Pydantic v2 schemas (Create, Update, Response per resource)
│   │   ├── routers/
│   │   │   ├── accounts.py          # CRUD + POST /accounts/{id}/sync
│   │   │   ├── bills.py             # CRUD + POST /bills/{id}/pay, background task logic
│   │   │   ├── payments.py          # CRUD
│   │   │   ├── payment_methods.py   # CRUD (encrypts card on create)
│   │   │   └── tasks.py             # GET /tasks/{id} (polling)
│   │   └── services/
│   │       ├── driver_runner.py     # Subprocess invocation, env var assembly
│   │       └── encryption.py        # Fernet encrypt/decrypt for card data
│   ├── drivers/                     # Standalone driver scripts (one per service provider)
│   ├── docs/
│   │   └── driver_spec.md           # Full driver specification
│   ├── alembic/                     # Migration scripts
│   │   ├── env.py                   # Configured with app models, render_as_batch=True
│   │   └── versions/
│   ├── alembic.ini
│   ├── pyproject.toml
│   └── .env                         # CARD_ENCRYPTION_KEY, DATABASE_URL
│
├── frontend/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx                  # Tab navigation (Cuentas / Tarjetas / Facturas / Pagos)
│   │   ├── index.css
│   │   ├── pages/
│   │   │   ├── AccountsPage.jsx     # Account CRUD + sync button
│   │   │   ├── BillsPage.jsx        # Bill list, sync/pay with task polling
│   │   │   ├── PaymentMethodsPage.jsx
│   │   │   └── PaymentsPage.jsx
│   │   ├── components/
│   │   │   ├── AccountForm.jsx      # Includes driver_name auto-generation
│   │   │   ├── AccountList.jsx      # Includes sync button for driver-enabled accounts
│   │   │   ├── PaymentForm.jsx
│   │   │   ├── PaymentMethodForm.jsx
│   │   │   └── PaymentMethodList.jsx
│   │   └── services/
│   │       └── api.js               # All fetch wrappers, task polling helper
│   ├── package.json
│   └── vite.config.js               # Proxy /api → :8000 (not currently used)
│
├── docs/
│   └── architecture.md              # This file
└── CLAUDE.md                        # Guidance for Claude Code
```

## Data Model

```
Account ──1:N──> Bill ──1:N──> Payment
   │                              │
   │                              │
   └──1:N──> Payment <──N:1── PaymentMethod
```

### Account

Represents a utility service (electricity, gas, water, HOA fees, etc.).

| Field        | Type   | Notes |
|--------------|--------|-------|
| name         | String | "Ecogas", "Electricidad (Edemsa)" |
| frequency    | String | monthly, bimonthly, quarterly, semiannual, annual |
| website_url  | String | URL to the service's payment portal |
| driver_name  | String | Maps to `drivers/{name}.py`. Auto-generated from name on create. |
| identifiers  | JSON   | Arbitrary key-value pairs: `{"numero_cuenta": "20441802"}` |

### Bill

A pending or paid obligation fetched from an external service via a driver.

| Field        | Type    | Notes |
|--------------|---------|-------|
| account_id   | FK      | References Account |
| external_id  | String  | ID from the driver (unique per account) |
| amount_cents | Integer | Amount in cents to avoid floating point |
| currency     | String  | ISO 4217, default "ARS" |
| due_date     | Date    | Payment deadline |
| status       | String  | "UNPAID" or "PAID" |
| fetched_at   | DateTime | When the driver returned this bill |
| paid_at      | DateTime | When it was paid (null if unpaid) |

### Payment

A record of money paid. Can be created manually (user logs a payment) or automatically (driver pays a bill).

| Field             | Type       | Notes |
|-------------------|------------|-------|
| account_id        | FK         | References Account |
| payment_method_id | FK, null   | References PaymentMethod |
| bill_id           | FK, null   | References Bill (set when driver pays) |
| amount            | Decimal    | Payment amount |
| status            | String     | pending, completed, failed |
| paid_at           | DateTime   | When payment occurred |
| notes             | String     | Optional user notes |

### PaymentMethod

Stored credit/debit card. Sensitive data is Fernet-encrypted (AES-128-CBC).

| Field            | Type        | Notes |
|------------------|-------------|-------|
| name             | String      | "Visa Personal" |
| card_type        | String      | "credit" or "debit" |
| last_four_digits | String(4)   | Plaintext for display |
| encrypted_data   | LargeBinary | Fernet-encrypted JSON: card_number, expiry_date, cvv |

### Task

Tracks async background operations (driver sync/pay). Frontend polls `GET /tasks/{id}` until completion.

| Field       | Type     | Notes |
|-------------|----------|-------|
| id          | String   | UUID |
| type        | String   | "sync" or "pay" |
| status      | String   | pending → running → completed / failed |
| account_id  | FK       | Which account |
| bill_id     | FK, null | Which bill (for pay tasks) |
| result      | JSON     | Raw driver output on completion |
| error       | String   | Error message on failure |

## API Endpoints

### Accounts
| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | /accounts/              | List all accounts |
| GET    | /accounts/{id}          | Get single account |
| POST   | /accounts/              | Create account (auto-generates driver_name) |
| PUT    | /accounts/{id}          | Update account |
| DELETE | /accounts/{id}          | Delete account |
| POST   | /accounts/{id}/sync     | Trigger driver fetch (async, returns task_id) |

### Bills
| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | /bills/                 | List bills (?account_id=N&status=UNPAID) |
| GET    | /bills/{id}             | Get single bill |
| POST   | /bills/{id}/pay         | Trigger driver pay (async, returns task_id) |

### Payments
| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | /payments/              | List payments (?account_id=N) |
| GET    | /payments/{id}          | Get single payment |
| POST   | /payments/              | Create payment manually |
| DELETE | /payments/{id}          | Delete payment |

### Payment Methods
| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | /payment-methods/       | List all |
| GET    | /payment-methods/{id}   | Get single |
| POST   | /payment-methods/       | Create (encrypts card data) |
| PUT    | /payment-methods/{id}   | Update name only |
| DELETE | /payment-methods/{id}   | Delete |

### Tasks
| Method | Path                    | Description |
|--------|-------------------------|-------------|
| GET    | /tasks/{id}             | Poll task status and result |

## Drivers

Drivers are standalone Python scripts in `backend/drivers/` that automate interactions with service providers (scraping, form submission, CAPTCHA solving). Full spec: `backend/docs/driver_spec.md`.

Key concepts:

- **Standalone execution:** Each driver uses `#!/usr/bin/env -S uv run` with inline dependency metadata. No shared virtualenv needed.
- **Three commands:** `fetch` (get unpaid bills), `pay <bill_id>` (pay a bill), `history` (get paid bills).
- **Input via env vars:** Account identifiers are passed as uppercased env vars (`NUMERO_CUENTA`, `NIC`, etc.). Card data is passed as `CARD_NUMBER`, `CARD_EXP_MONTH`, `CARD_EXP_YEAR`, `CARD_CVV` (only for `pay`).
- **Output:** JSON to stdout. Debug logs to stderr.
- **Invocation:** The backend runs drivers via `subprocess` in a background thread. Results are stored in a Task row and bills are upserted into the DB.

### Account → Driver Matching

The `Account.driver_name` column stores a slug (e.g., `"ecogas"`) that maps to `backend/drivers/ecogas.py`. When creating an account, `driver_name` is auto-generated from the account name:

```
"Ecogas" → "ecogas"
"Electricidad (Edemsa)" → "electricidad_edemsa"
```

The user can override the generated value.

## Async Operations

Sync and pay operations use background threads since drivers can be slow (Playwright browser automation, CAPTCHA solving, network delays).

**Flow:**

1. Frontend calls `POST /accounts/{id}/sync` or `POST /bills/{id}/pay`
2. Backend creates a Task (status: pending), returns `{"task_id": "uuid"}`
3. Background thread runs the driver subprocess, updates Task to running → completed/failed
4. Frontend polls `GET /tasks/{id}` every 2 seconds until terminal status
5. On sync completion, bills are upserted into the DB. On pay completion, a Payment record is created.

## Database Migrations

Managed by Alembic with `render_as_batch=True` for SQLite compatibility.

```bash
cd backend
uv run alembic revision --autogenerate -m "description"   # Generate migration
uv run alembic upgrade head                                # Apply migrations
uv run alembic current                                     # Check current revision
uv run alembic downgrade -1                                # Rollback one step
```

## Card Security

Card data (number, expiry, CVV) is encrypted at rest with Fernet (AES-128-CBC) in `encrypted_data`. Only `last_four_digits` is stored in plaintext for display. The encryption key (`CARD_ENCRYPTION_KEY`) is stored in `backend/.env`. When a driver needs card data for payment, the backend decrypts it and passes the values as environment variables to the subprocess — they never touch disk unencrypted.

## Frontend Patterns

- **Tab navigation:** State in `App.jsx`, no router. Tabs: Cuentas, Tarjetas, Facturas, Pagos.
- **Page components** own all state and data fetching. They call `api.js` wrappers.
- **api.js** is a single file with all fetch functions pointing at `http://localhost:8000`.
- **Locale:** `es-AR` for currency (ARS) and date formatting throughout.
- **Task polling:** `pollTask(taskId)` in `api.js` loops `GET /tasks/{id}` every 2s until completed/failed.
