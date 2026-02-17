import { useState } from 'react';

export default function PaymentMethodForm({ onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    card_type: 'credit',
    card_number: '',
    expiry_date: '',
    cvv: '',
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const formatCardNumber = (value) => {
    return value.replace(/\D/g, '').slice(0, 16);
  };

  const formatExpiry = (value) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 4);
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2);
    }
    return cleaned;
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>Nueva Tarjeta</h2>

      <div className="form-group">
        <label>Nombre descriptivo</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Visa Personal"
          required
        />
      </div>

      <div className="form-group">
        <label>Tipo</label>
        <select name="card_type" value={formData.card_type} onChange={handleChange}>
          <option value="credit">Crédito</option>
          <option value="debit">Débito</option>
        </select>
      </div>

      <div className="form-group">
        <label>Número de tarjeta</label>
        <input
          type="text"
          name="card_number"
          value={formData.card_number}
          onChange={(e) => setFormData((prev) => ({ ...prev, card_number: formatCardNumber(e.target.value) }))}
          placeholder="1234567890123456"
          maxLength="16"
          required
        />
      </div>

      <div style={{ display: 'flex', gap: '15px' }}>
        <div className="form-group" style={{ flex: 1 }}>
          <label>Vencimiento (MM/YY)</label>
          <input
            type="text"
            name="expiry_date"
            value={formData.expiry_date}
            onChange={(e) => setFormData((prev) => ({ ...prev, expiry_date: formatExpiry(e.target.value) }))}
            placeholder="12/25"
            maxLength="5"
            required
          />
        </div>

        <div className="form-group" style={{ flex: 1 }}>
          <label>CVV</label>
          <input
            type="password"
            name="cvv"
            value={formData.cvv}
            onChange={(e) => setFormData((prev) => ({ ...prev, cvv: e.target.value.replace(/\D/g, '').slice(0, 4) }))}
            placeholder="123"
            maxLength="4"
            required
          />
        </div>
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary">
          Guardar Tarjeta
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
