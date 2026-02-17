# Plan: Aplicación de Gestión de Cuentas

## Resumen
Aplicación web para gestionar y pagar cuentas de servicios (electricidad, agua, expensas, etc.) con automatización del proceso de pago.

## Stack Técnico
- **Frontend:** React (UI en Español)
- **Backend:** FastAPI (código en Inglés)
- **Base de datos:** SQLite
- **Servidor:** Local (red privada)

---

## Modelo de Datos

### Account (Cuenta)
```python
{
    "id": int,
    "name": str,                    # "Electricidad", "Agua", etc.
    "frequency": str,               # "monthly", "bimonthly", "quarterly", etc.
    "website_url": str,             # URL del sitio de pago
    "identifiers": dict,            # {"numero_cliente": "123", "codigo_pago": "ABC"}
    "created_at": datetime,
    "updated_at": datetime
}
```

### Payment (Pago)
```python
{
    "id": int,
    "account_id": int,              # FK a Account
    "payment_method_id": int,       # FK a PaymentMethod
    "amount": decimal,
    "paid_at": datetime,
    "status": str,                  # "pending", "completed", "failed"
    "notes": str | None
}
```

### PaymentMethod (Medio de Pago)
```python
{
    "id": int,
    "name": str,                    # "Visa terminada en 1234"
    "card_type": str,               # "credit", "debit"
    "last_four_digits": str,        # "1234" (solo para mostrar)
    "encrypted_data": bytes,        # Datos encriptados de la tarjeta
    "created_at": datetime
}
```

---

## Seguridad de Tarjetas

### Estrategia de Encriptación
1. **Fernet (AES-128-CBC)** via `cryptography` library
2. **Clave de encriptación** almacenada en variable de entorno (`CARD_ENCRYPTION_KEY`)
3. **Datos encriptados:**
   - Número completo de tarjeta
   - Fecha de vencimiento
   - CVV (solo en memoria durante transacción, nunca persistido)
4. **Datos NO encriptados:**
   - Últimos 4 dígitos (para identificación visual)
   - Nombre descriptivo

### Consideraciones Adicionales
- HTTPS obligatorio (incluso en red local)
- Rate limiting en endpoints sensibles
- Logs sin datos sensibles

---

## Manejo de CAPTCHAs

### Opciones a Considerar

#### Opción A: Redirección al usuario
- Automatizar hasta el punto del CAPTCHA
- Abrir el sitio en iframe/nueva pestaña con datos pre-llenados
- Usuario completa CAPTCHA y pago manualmente

#### Opción B: Servicios de resolución de CAPTCHA
- Integrar con servicios como 2Captcha o Anti-Captcha
- Costo por CAPTCHA resuelto
- Más automatizado pero con dependencia externa

#### Opción C: Híbrido
- Intentar automatización completa
- Si detecta CAPTCHA, notificar al usuario para intervención

**Recomendación inicial:** Opción A (redirección) para MVP, evaluar otras opciones según necesidad.

---

## Estructura del Proyecto

```
cuentasApp/
├── backend/
│   ├── app/
│   │   ├── __init__.py
│   │   ├── main.py              # FastAPI app
│   │   ├── config.py            # Configuración
│   │   ├── database.py          # SQLite setup
│   │   ├── models/              # SQLAlchemy models
│   │   │   ├── account.py
│   │   │   ├── payment.py
│   │   │   └── payment_method.py
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── routers/             # API endpoints
│   │   │   ├── accounts.py
│   │   │   ├── payments.py
│   │   │   └── payment_methods.py
│   │   ├── services/            # Lógica de negocio
│   │   │   ├── encryption.py    # Encriptación de tarjetas
│   │   │   └── payment_automation.py
│   │   └── utils/
│   ├── requirements.txt
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/            # API calls
│   │   └── App.jsx
│   ├── package.json
│   └── vite.config.js
├── PLAN.md
└── README.md
```

---

## Fases de Implementación

### Fase 1: Fundamentos
- [ ] Setup inicial del proyecto (estructura de carpetas)
- [ ] Configurar FastAPI con SQLite
- [ ] Crear modelos de base de datos
- [ ] CRUD básico de Cuentas (Accounts)
- [ ] Setup React con Vite
- [ ] UI básica para listar/crear cuentas

### Fase 2: Medios de Pago
- [ ] Implementar encriptación de tarjetas
- [ ] CRUD de medios de pago
- [ ] UI para gestionar tarjetas

### Fase 3: Pagos
- [ ] Registro de pagos manuales
- [ ] Historial de pagos por cuenta
- [ ] Dashboard con resumen

### Fase 4: Automatización (MVP)
- [ ] Investigar sitios específicos de cuentas del usuario
- [ ] Implementar scraping/automatización básica
- [ ] Manejo de redirección para CAPTCHAs

### Fase 5: Mejoras
- [ ] Recordatorios de pagos próximos
- [ ] Reportes y estadísticas
- [ ] Mejoras de UX

---

## Decisiones Tomadas

- **Usuario único:** Sin sistema de login, acceso directo
- **CVV:** Guardar encriptado para mayor automatización
- **Cuentas iniciales (Mendoza):**
  - Edemsa (Electricidad)
  - Aysam (Agua)
  - La Capilla (Expensas del barrio)

---

## Próximos Pasos Inmediatos

1. **Setup del proyecto:**
   - Crear estructura de carpetas
   - Inicializar backend FastAPI
   - Inicializar frontend React con Vite

2. **Backend básico:**
   - Configurar SQLite con SQLAlchemy
   - Crear modelos Account, Payment, PaymentMethod
   - Implementar CRUD de cuentas

3. **Frontend básico:**
   - Página principal con lista de cuentas
   - Formulario para agregar/editar cuentas
   - Navegación básica

---

## Notas
- Iremos iterando sobre este plan según avancemos
- Prioridad inicial: tener un MVP funcional para registrar cuentas y pagos
- La automatización de pagos será fase posterior (requiere investigar cada sitio)
