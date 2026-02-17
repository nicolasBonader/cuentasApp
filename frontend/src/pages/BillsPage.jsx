import { useState, useEffect } from 'react';
import { getBills, getAccounts, getPaymentMethods, syncAccount, payBill, pollTask } from '../services/api';

export default function BillsPage() {
  const [bills, setBills] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingAccounts, setSyncingAccounts] = useState({});
  const [payingBills, setPayingBills] = useState({});

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [billsData, accountsData, methodsData] = await Promise.all([
        getBills(),
        getAccounts(),
        getPaymentMethods(),
      ]);
      setBills(billsData);
      setAccounts(accountsData);
      setPaymentMethods(methodsData);
      setError(null);
    } catch (err) {
      setError('Error al cargar los datos.');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async (accountId) => {
    try {
      setSyncingAccounts((prev) => ({ ...prev, [accountId]: true }));
      setError(null);
      const { task_id } = await syncAccount(accountId);
      const task = await pollTask(task_id);
      if (task.status === 'failed') {
        setError(task.error || 'Error al sincronizar');
      }
      await loadData();
    } catch (err) {
      setError('Error al sincronizar cuenta');
    } finally {
      setSyncingAccounts((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handlePay = async (bill) => {
    let paymentMethodId = null;
    if (paymentMethods.length > 0) {
      const options = paymentMethods.map((m) => `${m.name} (•••• ${m.last_four_digits})`);
      const choice = window.prompt(
        `Seleccioná medio de pago:\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nIngresá el número (o dejá vacío para continuar sin medio de pago):`
      );
      if (choice === null) return;
      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < paymentMethods.length) {
        paymentMethodId = paymentMethods[idx].id;
      }
    }

    try {
      setPayingBills((prev) => ({ ...prev, [bill.id]: true }));
      setError(null);
      const { task_id } = await payBill(bill.id, paymentMethodId);
      const task = await pollTask(task_id);
      if (task.status === 'failed') {
        setError(task.error || 'Error al pagar factura');
      }
      await loadData();
    } catch (err) {
      setError('Error al pagar factura');
    } finally {
      setPayingBills((prev) => ({ ...prev, [bill.id]: false }));
    }
  };

  const accountsWithDrivers = accounts.filter((a) => a.driver_name);

  const getAccountName = (accountId) => {
    const account = accounts.find((a) => a.id === accountId);
    return account?.name || 'Desconocida';
  };

  const formatAmount = (cents, currency = 'ARS') => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency,
    }).format(cents / 100);
  };

  const formatDate = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  if (loading) {
    return <div className="container"><p>Cargando...</p></div>;
  }

  const unpaidBills = bills.filter((b) => b.status === 'UNPAID');
  const paidBills = bills.filter((b) => b.status === 'PAID');

  return (
    <div className="container">
      <div className="header">
        <h1>Facturas</h1>
      </div>

      {error && (
        <div className="card" style={{ background: '#fdeaea', color: '#c0392b', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {accountsWithDrivers.length > 0 && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <h3 style={{ marginBottom: '10px' }}>Sincronizar Cuentas</h3>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {accountsWithDrivers.map((account) => (
              <button
                key={account.id}
                className="btn btn-primary"
                disabled={syncingAccounts[account.id]}
                onClick={() => handleSync(account.id)}
              >
                {syncingAccounts[account.id] ? 'Sincronizando...' : `Sincronizar ${account.name}`}
              </button>
            ))}
          </div>
        </div>
      )}

      {unpaidBills.length > 0 && (
        <>
          <h2 style={{ marginBottom: '10px' }}>Pendientes</h2>
          <div className="account-list">
            {unpaidBills.map((bill) => (
              <div key={bill.id} className="card account-item">
                <div className="account-info">
                  <h3>{getAccountName(bill.account_id)}</h3>
                  <p>
                    <span style={{ fontWeight: 'bold', color: '#e67e22' }}>
                      {formatAmount(bill.amount_cents, bill.currency)}
                    </span>
                    <span style={{ marginLeft: '15px', color: '#666' }}>
                      Vence: {formatDate(bill.due_date)}
                    </span>
                  </p>
                </div>
                <div className="actions">
                  <span className="badge" style={{ background: '#f39c12', color: 'white', marginRight: '10px' }}>
                    PENDIENTE
                  </span>
                  <button
                    className="btn"
                    style={{ background: '#27ae60', color: 'white' }}
                    disabled={payingBills[bill.id]}
                    onClick={() => handlePay(bill)}
                  >
                    {payingBills[bill.id] ? 'Pagando...' : 'Pagar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {paidBills.length > 0 && (
        <>
          <h2 style={{ margin: '20px 0 10px' }}>Pagadas</h2>
          <div className="account-list">
            {paidBills.map((bill) => (
              <div key={bill.id} className="card account-item" style={{ opacity: 0.7 }}>
                <div className="account-info">
                  <h3>{getAccountName(bill.account_id)}</h3>
                  <p>
                    <span style={{ fontWeight: 'bold', color: '#27ae60' }}>
                      {formatAmount(bill.amount_cents, bill.currency)}
                    </span>
                    <span style={{ marginLeft: '15px', color: '#666' }}>
                      Venció: {formatDate(bill.due_date)}
                    </span>
                  </p>
                </div>
                <div className="actions">
                  <span className="badge" style={{ background: '#27ae60', color: 'white' }}>
                    PAGADA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {bills.length === 0 && accountsWithDrivers.length === 0 && (
        <div className="card empty-state">
          <p>No hay facturas.</p>
          <p>Agregá un driver a alguna cuenta para poder sincronizar facturas.</p>
        </div>
      )}

      {bills.length === 0 && accountsWithDrivers.length > 0 && (
        <div className="card empty-state">
          <p>No hay facturas aún.</p>
          <p>Usá los botones de arriba para sincronizar cuentas.</p>
        </div>
      )}
    </div>
  );
}
