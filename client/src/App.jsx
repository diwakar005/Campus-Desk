import { useState } from 'react';
import Chat from './components/Chat.jsx';
import ReportIssue from './components/ReportIssue.jsx';
import Admin from './components/Admin.jsx';

const TABS = [
  { id: 'chat', label: 'Ask a question' },
  { id: 'report', label: 'Report a problem' },
  { id: 'admin', label: 'Staff' }
];

export default function App() {
  const [tab, setTab] = useState('chat');
  // The admin key is kept for this browser tab only.
  const [adminKey, setAdminKeyState] = useState(() => sessionStorage.getItem('adminKey') || '');

  function setAdminKey(key) {
    setAdminKeyState(key);
    if (key) sessionStorage.setItem('adminKey', key);
    else sessionStorage.removeItem('adminKey');
  }

  return (
    <div className="shell">
      <header className="top">
        <div className="brand">
          <span className="mark" aria-hidden="true" />
          <h1>Campus Desk</h1>
        </div>
        <nav className="tabs" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className={tab === t.id ? 'tab active' : 'tab'}
              aria-current={tab === t.id ? 'page' : undefined}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="main">
        {/* Chat stays mounted so the conversation isn't lost when switching tabs. */}
        <div hidden={tab !== 'chat'}><Chat goReport={() => setTab('report')} /></div>
        {tab === 'report' && <ReportIssue />}
        {tab === 'admin' && <Admin adminKey={adminKey} setAdminKey={setAdminKey} />}
      </main>
    </div>
  );
}
