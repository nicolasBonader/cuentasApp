import { useState, useEffect } from 'react';
import PaymentForm from '../components/PaymentForm';
import { getPayments, getAccounts, getPaymentMethods, createPayment, deletePayment } from '../services/api';

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, accountsData, methodsData] = await Promise.all([
        getPayments(),
        getAccounts(),
        getPaymentMethods(),
      ]);
      setPayments(paymentsData);
      setAccounts(accountsData);
      setPaymentMethods(methodsData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await createPayment(data);
      await loadData();
      setShowForm(false);
    } catch (err) {
      setError('Error al registrar el pago');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar este pago?')) {
      try {
        await deletePayment(id);
        await loadData();
      } catch (err) {
        setError('Error al eliminar el pago');
      }
    }
  };

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Desconocida';
  };

  const getMethodName = (methodId) => {
    if (!methodId) return '-';
    const method = paymentMethods.find((m) => m.id === methodId);
    return method ? `${method.name} (•••• ${method.last_four_digits})` : '-';
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatAmount = (amount) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(amount);
  };

  if (loading) {
    return <div className="container"><p>Cargando...</p></div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Mis Pagos</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Registrar Pago
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: '#fdeaea', color: '#c0392b', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {showForm ? (
        <PaymentForm
          accounts={accounts}
          paymentMethods={paymentMethods}
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : payments.length === 0 ? (
        <div className="card empty-state">
          <p>No hay pagos registrados.</p>
        </div>
      ) : (
        <div className="account-list">
          {payments.map((payment) => (
            <div key={payment.id} className="card account-item">
              <div className="account-info">
                <h3>{getAccountName(payment.account_id)}</h3>
                <p>
                  <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                    {formatAmount(payment.amount)}
                  </span>
                  <span style={{ marginLeft: '15px', color: '#666' }}>
                    {formatDate(payment.paid_at)}
                  </span>
                </p>
                <p style={{ fontSize: '13px', color: '#888' }}>
                  {getMethodName(payment.payment_method_id)}
                  {payment.notes && ` — ${payment.notes}`}
                </p>
              </div>
              <div className="actions">
                <button className="btn btn-danger" onClick={() => handleDelete(payment.id)}>
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
