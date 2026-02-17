const CARD_TYPE_LABELS = {
  credit: 'Crédito',
  debit: 'Débito',
};

export default function PaymentMethodList({ methods, onDelete }) {
  if (methods.length === 0) {
    return (
      <div className="card empty-state">
        <p>No hay tarjetas registradas.</p>
        <p>Agregá una tarjeta para poder realizar pagos.</p>
      </div>
    );
  }

  return (
    <div className="account-list">
      {methods.map((method) => (
        <div key={method.id} className="card account-item">
          <div className="account-info">
            <h3>{method.name}</h3>
            <p>
              <span className="badge">{CARD_TYPE_LABELS[method.card_type]}</span>
              <span style={{ marginLeft: '10px', fontFamily: 'monospace' }}>
                •••• •••• •••• {method.last_four_digits}
              </span>
            </p>
          </div>
          <div className="actions">
            <button className="btn btn-danger" onClick={() => onDelete(method.id)}>
              Eliminar
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
