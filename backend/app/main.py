from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .database import engine, Base
from .routers import accounts, payment_methods, payments

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Cuentas App API",
    description="API para gestionar cuentas y pagos de servicios",
    version="0.1.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(accounts.router)
app.include_router(payment_methods.router)
app.include_router(payments.router)


@app.get("/")
def root():
    return {"message": "Cuentas App API"}


@app.get("/health")
def health():
    return {"status": "ok"}
