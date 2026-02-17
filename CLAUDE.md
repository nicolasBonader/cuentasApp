# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

For detailed architecture, data model, API endpoints, and driver system documentation, see **[docs/architecture.md](docs/architecture.md)**.

## What is this project?

Cuentas App — a personal web app to manage and pay utility bills (electricity, water, gas, HOA fees, etc.). No auth system. UI is in Spanish, backend code in English.

## Commands

### Backend (FastAPI + SQLite)
```bash
cd backend
uv sync                                    # Install dependencies
uv run uvicorn app.main:app --reload       # Run dev server on :8000
```

### Frontend (React + Vite)
```bash
cd frontend
npm install                                # Install dependencies
npm run dev                                # Run dev server on :5173
npm run build                              # Production build
```

### Database migrations (Alembic)
```bash
cd backend
uv run alembic revision --autogenerate -m "description"   # Generate migration
uv run alembic upgrade head                                # Apply migrations
uv run alembic current                                     # Check current revision
```

### Generate encryption key (one-time setup)
```python
from cryptography.fernet import Fernet
Fernet.generate_key().decode()
```
Put the result in `backend/.env` as `CARD_ENCRYPTION_KEY`.

## Architecture

**Monorepo with two independent apps:**

- `backend/` — FastAPI, SQLAlchemy ORM, SQLite, Pydantic v2, Alembic migrations. Managed with `uv`.
- `frontend/` — React 18 + Vite, plain JSX (no TypeScript), inline styles. Tab-based navigation managed via state in `App.jsx`.

**Backend structure:** `app/main.py` is the FastAPI entrypoint. Five resource modules each follow the same pattern:
- `models/<resource>.py` — SQLAlchemy model
- `schemas/<resource>.py` — Pydantic schemas (Create, Update, Response)
- `routers/<resource>.py` — CRUD endpoints

Resources: accounts, bills, payments, payment_methods, tasks.

API prefix convention: `/accounts`, `/bills`, `/payment-methods`, `/payments`, `/tasks`.

**Driver system:** Standalone Python scripts in `backend/drivers/` that automate service interactions via Playwright. Invoked by the backend as subprocesses. Input via env vars, output as JSON to stdout. Full spec: `backend/docs/driver_spec.md`.

**Card encryption:** Payment method card data (number, expiry, CVV) is encrypted with Fernet (AES-128-CBC) via `app/services/encryption.py`. Only `last_four_digits` is stored in plaintext.

## Language convention

All code (variable names, function names, comments, commit messages) must be in **English**. All user-facing text (UI labels, error messages, placeholders, API user-facing strings) must be in **Spanish**.

## Code conventions

- Only add comments that clarify non-obvious logic. Don't write comments that repeat what the code already shows. Comments should explain "why", not "what".
- No code duplication: extract shared logic into reusable components/utilities instead of copying code.

## Key conventions

- Backend uses SQLAlchemy's legacy `Column()` style (not mapped_column)
- Pydantic schemas use `model_dump()` and `from_attributes = True` (Pydantic v2)
- API error messages are in Spanish ("Cuenta no encontrada", etc.)
- Frontend uses `es-AR` locale for currency (ARS) and date formatting
- `Account.identifiers` is a JSON column for arbitrary key-value pairs (e.g. `numero_cuenta`, `nic`)
- `Account.driver_name` maps to `backend/drivers/{name}.py`, auto-generated from account name on create
- `Bill.amount_cents` stores amounts in cents (integer) to avoid floating point issues
- Schema changes require Alembic migrations (`uv run alembic revision --autogenerate`)
- Alembic uses `render_as_batch=True` for SQLite compatibility
- Async operations (sync/pay) use background threads with Task-based polling
