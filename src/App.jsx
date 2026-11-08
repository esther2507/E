import React, { useState } from 'react';
import Login from './Login';
import LettersBoard from './LettersBoard';
import CombosBoard from './CombosBoard';
import NonwordsBoard from './NonwordsBoard';

export default function App() {
  const [user, setUser] = useState(null); 
  const [activeTab, setActiveTab] = useState('letters'); 

  if (!user) {
    return <Login onSuccess={setUser} />;
  }

  return (
    <div style={appContainerStyle}>
      <header style={headerStyle}>
        <div style={headerTopRow}>
          <h1 style={appTitleStyle}>מערכת מבדקי קריאה - אבני יסוד</h1>
          <button onClick={() => setUser(null)} style={logoutBtnStyle}>
            התנתק
          </button>
        </div>
        <nav style={navStyle}>
          <button
            onClick={() => setActiveTab('letters')}
            style={activeTab === 'letters' ? activeTabStyle : tabStyle}
          >
            שלב 1: אותיות
          </button>
          <button
            onClick={() => setActiveTab('combos')}
            style={activeTab === 'combos' ? activeTabStyle : tabStyle}
          >
            שלב 2: צירופים
          </button>
          <button
            onClick={() => setActiveTab('nonsense')}
            style={activeTab === 'nonsense' ? activeTabStyle : tabStyle}
          >
            שלב 3: מילות תפל
          </button>
        </nav>
      </header>

      <main style={mainContentStyle}>
        {activeTab === 'letters' && <LettersBoard />}
        {activeTab === 'combos' && <CombosBoard />}
        {activeTab === 'nonsense' && <NonwordsBoard />}
      </main>
    </div>
  );
}

const appContainerStyle = {
  minHeight: '100vh',
  background: 'linear-gradient(135deg, #e0c3fc 0%, #8ec5fc 1005)',
  fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  direction: 'rtl',
  paddingBottom: '40px',
  boxSizing: 'border-box',
};

const headerStyle = {
  backgroundColor: '#ffffff',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
  padding: '20px 30px',
  marginBottom: '30px',
  boxSizing: 'border-box',
};

const headerTopRow = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '15px',
};

const appTitleStyle = {
  margin: '0',
  color: '#1e293b',
  fontSize: '24px',
  fontWeight: '800',
};

const logoutBtnStyle = {
  padding: '6px 14px',
  backgroundColor: '#fef2f2',
  color: '#dc2626',
  border: '1px solid #fecaca',
  borderRadius: '8px',
  cursor: 'pointer',
  fontWeight: '600',
  fontSize: '13px',
  transition: 'all 0.2s ease',
};

const navStyle = {
  display: 'flex',
  justifyContent: 'center',
  gap: '12px',
  flexWrap: 'wrap',
};

const tabStyle = {
  padding: '10px 22px',
  fontSize: '15px',
  border: '1.5px solid #cbd5e1',
  borderRadius: '10px',
  backgroundColor: '#ffffff',
  color: '#475569',
  cursor: 'pointer',
  fontWeight: '600',
  transition: 'all 0.2s ease',
};

const activeTabStyle = {
  ...tabStyle,
  backgroundColor: '#2563eb',
  color: '#ffffff',
  borderColor: '#2563eb',
  fontWeight: '700',
  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)',
};

const mainContentStyle = {
  padding: '0 20px',
  boxSizing: 'border-box',
  display: 'flex',
  justifyContent: 'center',
};