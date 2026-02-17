import { useState, useEffect } from 'react';

const FREQUENCIES = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'bimonthly', label: 'Bimestral' },
  { value: 'quarterly', label: 'Trimestral' },
  { value: 'semiannual', label: 'Semestral' },
  { value: 'annual', label: 'Anual' },
];

export default function AccountForm({ account, onSubmit, onCancel }) {
  const [formData, setFormData] = useState({
    name: '',
    frequency: 'monthly',
    website_url: '',
    driver_name: '',
    identifiers: {},
  });
  const [driverNameManual, setDriverNameManual] = useState(false);
  const [identifierKey, setIdentifierKey] = useState('');
  const [identifierValue, setIdentifierValue] = useState('');

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        frequency: account.frequency || 'monthly',
        website_url: account.website_url || '',
        driver_name: account.driver_name || '',
        identifiers: account.identifiers || {},
      });
      if (account.driver_name) setDriverNameManual(true);
    }
  }, [account]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const generateDriverName = (name) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      if (name === 'name' && !driverNameManual) {
        updated.driver_name = generateDriverName(value);
      }
      return updated;
    });
  };

  const addIdentifier = () => {
    if (identifierKey.trim() && identifierValue.trim()) {
      setFormData((prev) => ({
        ...prev,
        identifiers: {
          ...prev.identifiers,
          [identifierKey.trim()]: identifierValue.trim(),
        },
      }));
      setIdentifierKey('');
      setIdentifierValue('');
    }
  };

  const removeIdentifier = (key) => {
    setFormData((prev) => {
      const newIdentifiers = { ...prev.identifiers };
      delete newIdentifiers[key];
      return { ...prev, identifiers: newIdentifiers };
    });
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2>{account ? 'Editar Cuenta' : 'Nueva Cuenta'}</h2>

      <div className="form-group">
        <label>Nombre</label>
        <input
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          placeholder="Ej: Electricidad (Edemsa)"
          required
        />
      </div>

      <div className="form-group">
        <label>Frecuencia de Pago</label>
        <select name="frequency" value={formData.frequency} onChange={handleChange}>
          {FREQUENCIES.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>URL del Sitio Web</label>
        <input
          type="url"
          name="website_url"
          value={formData.website_url}
          onChange={handleChange}
          placeholder="https://..."
        />
      </div>

      <div className="form-group">
        <label>Nombre del Driver</label>
        <input
          type="text"
          name="driver_name"
          value={formData.driver_name}
          onChange={(e) => {
            setDriverNameManual(true);
            setFormData((prev) => ({ ...prev, driver_name: e.target.value }));
          }}
          placeholder="Se genera automáticamente del nombre"
        />
        <small style={{ color: '#888' }}>
          Debe coincidir con el archivo en drivers/ (ej: ecogas → drivers/ecogas.py)
        </small>
      </div>

      <div className="form-group">
        <label>Identificadores</label>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '10px' }}>
          <input
            type="text"
            value={identifierKey}
            onChange={(e) => setIdentifierKey(e.target.value)}
            placeholder="Nombre (ej: numero_cliente)"
            style={{ flex: 1 }}
          />
          <input
            type="text"
            value={identifierValue}
            onChange={(e) => setIdentifierValue(e.target.value)}
            placeholder="Valor"
            style={{ flex: 1 }}
          />
          <button type="button" className="btn btn-secondary" onClick={addIdentifier}>
            Agregar
          </button>
        </div>
        {Object.entries(formData.identifiers).map(([key, value]) => (
          <div
            key={key}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '5px 10px',
              background: '#f0f0f0',
              borderRadius: '5px',
              marginBottom: '5px',
            }}
          >
            <span>
              <strong>{key}:</strong> {value}
            </span>
            <button
              type="button"
              onClick={() => removeIdentifier(key)}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#e74c3c' }}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <div className="actions">
        <button type="submit" className="btn btn-primary">
          {account ? 'Guardar Cambios' : 'Crear Cuenta'}
        </button>
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
