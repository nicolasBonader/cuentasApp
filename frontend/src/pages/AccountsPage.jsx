import { useState, useEffect } from 'react';
import AccountList from '../components/AccountList';
import AccountForm from '../components/AccountForm';
import { getAccounts, createAccount, updateAccount, deleteAccount, syncAccount, pollTask } from '../services/api';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [syncingAccounts, setSyncingAccounts] = useState({});

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await getAccounts();
      setAccounts(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar las cuentas. Asegurate de que el servidor esté corriendo.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await createAccount(data);
      await loadAccounts();
      setShowForm(false);
    } catch (err) {
      setError('Error al crear la cuenta');
    }
  };

  const handleUpdate = async (data) => {
    try {
      await updateAccount(editingAccount.id, data);
      await loadAccounts();
      setEditingAccount(null);
      setShowForm(false);
    } catch (err) {
      setError('Error al actualizar la cuenta');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta cuenta?')) {
      try {
        await deleteAccount(id);
        await loadAccounts();
      } catch (err) {
        setError('Error al eliminar la cuenta');
      }
    }
  };

  const handleEdit = (account) => {
    setEditingAccount(account);
    setShowForm(true);
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
    } catch (err) {
      setError('Error al sincronizar cuenta');
    } finally {
      setSyncingAccounts((prev) => ({ ...prev, [accountId]: false }));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  if (loading) {
    return <div className="container"><p>Cargando...</p></div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Mis Cuentas</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nueva Cuenta
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: '#fdeaea', color: '#c0392b', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {showForm ? (
        <AccountForm
          account={editingAccount}
          onSubmit={editingAccount ? handleUpdate : handleCreate}
          onCancel={handleCancel}
        />
      ) : (
        <AccountList
          accounts={accounts}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onSync={handleSync}
          syncingAccounts={syncingAccounts}
        />
      )}
    </div>
  );
}
