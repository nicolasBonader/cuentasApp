import { useState } from 'react';

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      style={{
        padding: '4px 8px',
        fontSize: '12px',
        background: copied ? '#27ae60' : '#3498db',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
      }}
    >
      {copied ? 'Copiado!' : 'Copiar'}
    </button>
  );
}

export default function PaymentForm({ accounts, paymentMethods, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    account_id: accounts[0]?.id || '',
    payment_method_id: paymentMethods[0]?.id || '',
    amount: '',
    notes: '',
    paid_at: '',
  });
  const [useCustomDate, setUseCustomDate] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === Number(formData.account_id));
  const identifiers = selectedAccount?.identifiers || {};
  const hasIdentifiers = Object.keys(identifiers).length > 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      account_id: Number(formData.account_id),
      payment_method_id: formData.payment_method_id ? Number(formData.payment_method_id) : null,
      amount: Number(formData.amount),
      notes: formData.notes || null,
    };
    // Solo incluir paid_at si se especificó una fecha personalizada
    if (useCustomDate && formData.paid_at) {
      payload.paid_at = new Date(formData.paid_at).toISOString();
    }
    onSubmit(payload);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (accounts.length === 0) {
    return (
      <div className="card">
        <p>Primero necesitás crear una cuenta para registrar pagos.</p>
        <button className="btn btn-secondary" onClick={onCancel}>Volver</button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Registrar Pago</h2>

      <div className="form-group">
        <label>Cuenta</label>
        <select name="account_id" value={formData.account_id} onChange={handleChange} required>
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>{acc.name}</option>
          ))}
        </select>
      </div>

      {hasIdentifiers && (
        <div style={{
          background: '#f8f9fa',
          padding: '15px',
          borderRadius: '8px',
          marginBottom: '15px',
        }}>
          <label style={{ display: 'block', marginBottom: '10px', fontWeight: '500' }}>
            Datos de la cuenta
          </label>
          {Object.entries(identifiers).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '8px 0',
                borderBottom: '1px solid #e0e0e0',
              }}
            >
              <div>
                <span style={{ color: '#666', fontSize: '13px' }}>{key}</span>
                <div style={{ fontFamily: 'monospace', fontSize: '14px' }}>{value}</div>
              </div>
              <CopyButton value={value} />
            </div>
          ))}
        </div>
      )}

      <div className="form-group">
        <label>Medio de Pago</label>
        <select name="payment_method_id" value={formData.payment_method_id} onChange={handleChange}>
          <option value="">Sin especificar</option>
          {paymentMethods.map((pm) => (
            <option key={pm.id} value={pm.id}>{pm.name} (•••• {pm.last_four_digits})</option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Monto ($)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label>Notas (opcional)</label>
        <input
          type="text"
          name="notes"
          value={formData.notes}
          onChange={handleChange}
          placeholder="Ej: Período Enero 2024"
        />
      </div>

      <div className="form-group">
        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={useCustomDate}
            onChange={(e) => setUseCustomDate(e.target.checked)}
            style={{ width: 'auto' }}
          />
          Registrar con fecha anterior
        </label>
        {useCustomDate && (
          <input
            type="date"
            name="paid_at"
            value={formData.paid_at}
            onChange={handleChange}
            style={{ marginTop: '10px' }}
            max={new Date().toISOString().split('T')[0]}
            required={useCustomDate}
          />
        )}
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary">
          Registrar Pago
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
