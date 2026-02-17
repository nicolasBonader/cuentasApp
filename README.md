# Cuentas App

Aplicación para gestionar y pagar cuentas de servicios (electricidad, agua, expensas, etc.)

## Requisitos

- Node.js 18+
- Python 3.11+
- [uv](https://docs.astral.sh/uv/) (gestor de paquetes Python)

## Instalación

### Backend

```bash
cd backend
uv sync
```

### Frontend

```bash
cd frontend
npm install
```

## Correr la aplicación

Necesitás dos terminales:

### Terminal 1 - Backend (puerto 8000)

```bash
cd backend
uv run uvicorn app.main:app --reload
```

### Terminal 2 - Frontend (puerto 5173)

```bash
cd frontend
npm run dev
```

Abrí http://localhost:5173 en el navegador.

## API Docs

Con el backend corriendo, podés ver la documentación de la API en:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
