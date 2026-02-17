import { useState } from 'react';

const FREQUENCY_LABELS = {
  monthly: 'Mensual',
  bimonthly: 'Bimestral',
  quarterly: 'Trimestral',
  semiannual: 'Semestral',
  annual: 'Anual',
};

export default function AccountList({ accounts, onEdit, onDelete }) {
  const [copiedId, setCopiedId] = useState(null);

  const handleGoToPay = async (account) => {
    const identifiers = account.identifiers || {};
    const keys = Object.keys(identifiers);

    if (keys.length > 0) {
      // Priorizar 'nic' si existe, sino usar el primero
      const keyToCopy = keys.includes('nic') ? 'nic' : keys[0];
      const valueToCopy = identifiers[keyToCopy];

      await navigator.clipboard.writeText(valueToCopy);
      setCopiedId(account.id);
      setTimeout(() => setCopiedId(null), 3000);
    }

    if (account.website_url) {
      window.open(account.website_url, '_blank');
    }
  };

  if (accounts.length === 0) {
    return (
      <div className="card empty-state">
        <p>No hay cuentas registradas.</p>
        <p>Agregá tu primera cuenta para comenzar.</p>
      </div>
    );
  }

  return (
    <div className="account-list">
      {accounts.map((account) => {
        const hasWebsite = !!account.website_url;
        const hasIdentifiers = Object.keys(account.identifiers || {}).length > 0;
        const canPay = hasWebsite;

        return (
          <div key={account.id} className="card account-item">
            <div className="account-info">
              <h3>{account.name}</h3>
              <p>
                <span className="badge">{FREQUENCY_LABELS[account.frequency] || account.frequency}</span>
                {copiedId === account.id && (
                  <span style={{
                    marginLeft: '10px',
                    color: '#27ae60',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}>
                    Identificador copiado!
                  </span>
                )}
              </p>
              {hasIdentifiers && (
                <p style={{ marginTop: '5px', fontSize: '13px' }}>
                  {Object.entries(account.identifiers).map(([key, value]) => (
                    <span key={key} style={{ marginRight: '15px' }}>
                      <strong>{key}:</strong> {value}
                    </span>
                  ))}
                </p>
              )}
            </div>
            <div className="actions">
              {canPay && (
                <button
                  className="btn"
                  onClick={() => handleGoToPay(account)}
                  style={{ background: '#27ae60', color: 'white' }}
                >
                  Ir a pagar
                </button>
              )}
              <button className="btn btn-primary" onClick={() => onEdit(account)}>
                Editar
              </button>
              <button className="btn btn-danger" onClick={() => onDelete(account.id)}>
                Eliminar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
