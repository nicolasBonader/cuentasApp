#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.13"
# dependencies = [
#     "playwright",
#     "playwright-recaptcha",
#     "standard-aifc",
#     "audioop-lts",
# ]
# ///

import sys
import json
import os
import re

from playwright.sync_api import sync_playwright
from playwright_recaptcha import recaptchav2

URL = "https://autogestion.ecogas.com.ar/uiextranet/ingreso"


def log(msg):
    print(msg, file=sys.stderr)


def output(result):
    print(json.dumps(result))


def require_env(*names):
    missing = [n for n in names if not os.environ.get(n)]
    if missing:
        result = {
            "errors": [f"Faltan variables de entorno requeridas: {', '.join(missing)}"],
            "bills": [],
        }
        output(result)
        sys.exit(1)


def parse_amount_cents(text):
    """Parse an Argentine currency string like '$1.234,56' into cents (123456)."""
    text = text.strip().lstrip("$").strip()
    # Remove thousands separator (.) and replace decimal comma with dot
    text = text.replace(".", "").replace(",", ".")
    try:
        return int(round(float(text) * 100))
    except ValueError:
        return 0


def login(page):
    """Navigate to Ecogas and log in with the account number. Returns the page on the dashboard."""
    numero_cuenta = os.environ["NUMERO_CUENTA"]

    log(f"[*] Navigando a {URL}...")
    page.goto(URL, wait_until="domcontentloaded", timeout=60000)
    page.wait_for_selector("#cliente", timeout=15000)
    page.wait_for_timeout(3000)

    log(f"[*] Ingresando cuenta {numero_cuenta}...")
    page.fill("#cliente", numero_cuenta)
    page.wait_for_timeout(1000)

    log("[*] Resolviendo reCAPTCHA...")
    with recaptchav2.SyncSolver(page) as solver:
        token = solver.solve_recaptcha(wait=True)
        log(f"[*] reCAPTCHA resuelto, token: {token[:40]}...")

    page.wait_for_timeout(1000)

    log("[*] Enviando formulario...")
    page.click("#boton_ingreso")

    # Wait for the dashboard to load — look for the account number on the page
    page.wait_for_selector("text=Panel de Control", timeout=30000)
    log("[*] Dashboard cargado.")


def fetch():
    """Fetch unpaid bills from the Ecogas dashboard."""
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        try:
            login(page)

            # Check if there's no debt
            no_debt = page.query_selector("text=Estas al dia")
            if no_debt is None:
                no_debt = page.query_selector("text=No tienes deuda")

            if no_debt:
                log("[*] No hay deuda pendiente.")
                return {"errors": [], "bills": []}

            # Parse the "Comprobantes Adeudados" section (DataTables table)
            bills = []
            bill_rows = page.query_selector_all("table tbody tr")

            for row in bill_rows:
                bill = parse_bill_row(row)
                if bill:
                    bills.append(bill)

            if not bills:
                debug_path = os.environ.get("DEBUG_HTML_PATH")
                if debug_path:
                    with open(debug_path, "w") as f:
                        f.write(page.content())
                    log(f"[DEBUG] HTML guardado en {debug_path}")

            return {"errors": [], "bills": bills}

        except Exception as e:
            log(f"[ERROR] {e}")
            return {"errors": [str(e)], "bills": []}

        finally:
            browser.close()


def parse_date(dd_mm_yyyy):
    """Convert DD/MM/YYYY to YYYY-MM-DD."""
    match = re.match(r"(\d{2})/(\d{2})/(\d{4})", dd_mm_yyyy.strip())
    if not match:
        return ""
    return f"{match.group(3)}-{match.group(2)}-{match.group(1)}"


def parse_bill_row(row):
    """Extract bill data from a comprobante table row.

    The rows are tab-separated with columns:
      ID  Type  Amount  DueDate  PayDate(or IssueDate)
    Example: "0401B55066766A  FC  25.262,95  23/01/2026  13/01/2026"
    """
    text = row.inner_text().strip()

    # Skip empty rows or "no data" messages
    if not text or "no hay datos" in text.lower() or "no tienes" in text.lower():
        return None

    # Split by tabs
    cols = [c.strip() for c in text.split("\t") if c.strip()]

    # Expect at least 3 columns: ID, Type, Amount
    if len(cols) < 3:
        return None

    bill_id = cols[0]
    # cols[1] is the type (FC = factura), skip it
    amount_cents = parse_amount_cents(cols[2])

    # First date is the due date (vencimiento)
    due_date = parse_date(cols[3]) if len(cols) > 3 else ""

    return {
        "id": bill_id,
        "amountCents": amount_cents,
        "currency": "ARS",
        "dueDate": due_date,
        "status": "UNPAID",
    }


def history():
    """Fetch payment history from Ecogas."""
    with sync_playwright() as pw:
        browser = pw.chromium.launch()
        page = browser.new_page(viewport={"width": 1280, "height": 720})

        try:
            login(page)

            # Click on "Ver comprobantes pagados"
            link = page.query_selector("text=Ver comprobantes pagados")
            if not link:
                link = page.query_selector("text=comprobantes pagados")

            if not link:
                return {
                    "errors": ["No se encontró el enlace a comprobantes pagados"],
                    "bills": [],
                }

            link.click()
            page.wait_for_timeout(3000)

            bills = []
            bill_rows = page.query_selector_all("table tbody tr")

            for row in bill_rows:
                bill = parse_bill_row(row)
                if bill:
                    bill["status"] = "PAID"
                    bills.append(bill)

            if not bills:
                debug_path = os.environ.get("DEBUG_HTML_PATH")
                if debug_path:
                    with open(debug_path, "w") as f:
                        f.write(page.content())
                    log(f"[DEBUG] HTML guardado en {debug_path}")

            return {"errors": [], "bills": bills}

        except Exception as e:
            log(f"[ERROR] {e}")
            return {"errors": [str(e)], "bills": []}

        finally:
            browser.close()


def pay(bill_id):
    """Pay is not supported for Ecogas."""
    return {
        "errors": ["Comando 'pay' no soportado para Ecogas. Pagar manualmente en el sitio web."],
        "bills": [],
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        output({"errors": ["Uso: ecogas.py <fetch|pay|history> [bill_id]"], "bills": []})
        sys.exit(1)

    require_env("NUMERO_CUENTA")

    command = sys.argv[1]

    if command == "fetch":
        result = fetch()
    elif command == "pay":
        if len(sys.argv) < 3:
            output({"errors": ["Uso: ecogas.py pay <bill_id>"], "bills": []})
            sys.exit(1)
        result = pay(sys.argv[2])
    elif command == "history":
        result = history()
    else:
        result = {"errors": [f"Comando desconocido: {command}"], "bills": []}

    output(result)
