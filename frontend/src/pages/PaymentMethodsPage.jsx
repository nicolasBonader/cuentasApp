import { useState, useEffect } from 'react';
import PaymentMethodList from '../components/PaymentMethodList';
import PaymentMethodForm from '../components/PaymentMethodForm';
import { getPaymentMethods, createPaymentMethod, deletePaymentMethod } from '../services/api';

export default function PaymentMethodsPage() {
  const [methods, setMethods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadMethods();
  }, []);

  const loadMethods = async () => {
    try {
      setLoading(true);
      const data = await getPaymentMethods();
      setMethods(data);
      setError(null);
    } catch (err) {
      setError('Error al cargar los medios de pago.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (data) => {
    try {
      await createPaymentMethod(data);
      await loadMethods();
      setShowForm(false);
    } catch (err) {
      setError('Error al crear la tarjeta');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Estás seguro de eliminar esta tarjeta?')) {
      try {
        await deletePaymentMethod(id);
        await loadMethods();
      } catch (err) {
        setError('Error al eliminar la tarjeta');
      }
    }
  };

  if (loading) {
    return <div className="container"><p>Cargando...</p></div>;
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Mis Tarjetas</h1>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            + Nueva Tarjeta
          </button>
        )}
      </div>

      {error && (
        <div className="card" style={{ background: '#fdeaea', color: '#c0392b', marginBottom: '15px' }}>
          {error}
        </div>
      )}

      {showForm ? (
        <PaymentMethodForm
          onSubmit={handleCreate}
          onCancel={() => setShowForm(false)}
        />
      ) : (
        <PaymentMethodList methods={methods} onDelete={handleDelete} />
      )}
    </div>
  );
}
