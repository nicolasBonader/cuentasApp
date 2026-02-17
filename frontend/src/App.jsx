import { useState } from 'react';
import AccountsPage from './pages/AccountsPage';
import BillsPage from './pages/BillsPage';
import PaymentMethodsPage from './pages/PaymentMethodsPage';
import PaymentsPage from './pages/PaymentsPage';

const TABS = [
  { id: 'accounts', label: 'Cuentas' },
  { id: 'cards', label: 'Tarjetas' },
  { id: 'bills', label: 'Facturas' },
  { id: 'payments', label: 'Pagos' },
];

function App() {
  const [activeTab, setActiveTab] = useState('accounts');

  return (
    <div>
      <nav style={{
        background: '#2c3e50',
        padding: '0 20px',
        display: 'flex',
        gap: '5px',
      }}>
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: '15px 25px',
              border: 'none',
              background: activeTab === tab.id ? '#3498db' : 'transparent',
              color: 'white',
              cursor: 'pointer',
              fontSize: '15px',
              transition: 'background 0.2s',
            }}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {activeTab === 'accounts' && <AccountsPage />}
      {activeTab === 'cards' && <PaymentMethodsPage />}
      {activeTab === 'bills' && <BillsPage />}
      {activeTab === 'payments' && <PaymentsPage />}
    </div>
  );
}

export default App;
