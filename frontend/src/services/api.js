const API_BASE = 'http://localhost:8000';

export async function getAccounts() {
  const response = await fetch(`${API_BASE}/accounts/`);
  if (!response.ok) throw new Error('Error al obtener cuentas');
  return response.json();
}

export async function getAccount(id) {
  const response = await fetch(`${API_BASE}/accounts/${id}`);
  if (!response.ok) throw new Error('Cuenta no encontrada');
  return response.json();
}

export async function createAccount(account) {
  const response = await fetch(`${API_BASE}/accounts/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!response.ok) throw new Error('Error al crear cuenta');
  return response.json();
}

export async function updateAccount(id, account) {
  const response = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(account),
  });
  if (!response.ok) throw new Error('Error al actualizar cuenta');
  return response.json();
}

export async function deleteAccount(id) {
  const response = await fetch(`${API_BASE}/accounts/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar cuenta');
  return response.json();
}

// Payment Methods
export async function getPaymentMethods() {
  const response = await fetch(`${API_BASE}/payment-methods/`);
  if (!response.ok) throw new Error('Error al obtener medios de pago');
  return response.json();
}

export async function createPaymentMethod(data) {
  const response = await fetch(`${API_BASE}/payment-methods/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al crear medio de pago');
  return response.json();
}

export async function deletePaymentMethod(id) {
  const response = await fetch(`${API_BASE}/payment-methods/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar medio de pago');
  return response.json();
}

// Payments
export async function getPayments(accountId = null) {
  const url = accountId
    ? `${API_BASE}/payments/?account_id=${accountId}`
    : `${API_BASE}/payments/`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener pagos');
  return response.json();
}

export async function createPayment(data) {
  const response = await fetch(`${API_BASE}/payments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!response.ok) throw new Error('Error al registrar pago');
  return response.json();
}

export async function deletePayment(id) {
  const response = await fetch(`${API_BASE}/payments/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) throw new Error('Error al eliminar pago');
  return response.json();
}

// Bills
export async function getBills(accountId = null, status = null) {
  const params = new URLSearchParams();
  if (accountId) params.set('account_id', accountId);
  if (status) params.set('status', status);
  const qs = params.toString();
  const url = qs ? `${API_BASE}/bills/?${qs}` : `${API_BASE}/bills/`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Error al obtener facturas');
  return response.json();
}

export async function syncAccount(id) {
  const response = await fetch(`${API_BASE}/accounts/${id}/sync`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Error al sincronizar cuenta');
  return response.json();
}

export async function payBill(id, paymentMethodId = null) {
  const params = paymentMethodId ? `?payment_method_id=${paymentMethodId}` : '';
  const response = await fetch(`${API_BASE}/bills/${id}/pay${params}`, {
    method: 'POST',
  });
  if (!response.ok) throw new Error('Error al pagar factura');
  return response.json();
}

export async function getTask(id) {
  const response = await fetch(`${API_BASE}/tasks/${id}`);
  if (!response.ok) throw new Error('Error al obtener tarea');
  return response.json();
}

export async function pollTask(taskId, intervalMs = 2000) {
  while (true) {
    const task = await getTask(taskId);
    if (task.status === 'completed' || task.status === 'failed') {
      return task;
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}
