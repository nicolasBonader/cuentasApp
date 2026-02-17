# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What is this project?

Cuentas App — a personal web app to manage and pay utility bills (electricity, water, HOA fees, etc.) for a single user in Mendoza, Argentina. No auth system. UI is in Spanish, backend code in English.

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

### Generate encryption key (one-time setup)
```python
from cryptography.fernet import Fernet
Fernet.generate_key().decode()
```
Put the result in `backend/.env` as `CARD_ENCRYPTION_KEY`.

## Architecture

**Monorepo with two independent apps:**

- `backend/` — FastAPI, SQLAlchemy ORM, SQLite (`cuentas.db` created at project root of backend), Pydantic v2 schemas. Managed with `uv` (see `pyproject.toml`). Config via `pydantic-settings` loading from `backend/.env`.
- `frontend/` — React 18 + Vite, plain JSX (no TypeScript), inline styles (no CSS framework). Tab-based navigation (Cuentas / Tarjetas / Pagos) managed via state in `App.jsx`, no client-side router.

**Backend structure:** `app/main.py` is the FastAPI entrypoint. Tables are auto-created via `Base.metadata.create_all()` on startup. Three resource modules each follow the same pattern:
- `models/<resource>.py` — SQLAlchemy model
- `schemas/<resource>.py` — Pydantic schemas (Create, Update, Response)
- `routers/<resource>.py` — CRUD endpoints

API prefix convention: `/accounts`, `/payment-methods`, `/payments`.

**Frontend structure:** Each tab maps to a page component in `src/pages/` which owns state and calls `src/services/api.js` (single file with all fetch wrappers hitting `http://localhost:8000` directly). Forms and lists are in `src/components/`.

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
- `Account.identifiers` is a JSON column for arbitrary key-value pairs (e.g. `numero_cliente`, `nic`)
- Vite config has an `/api` proxy to `:8000` but the frontend currently calls the backend directly
