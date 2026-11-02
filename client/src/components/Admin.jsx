import { useEffect, useState } from 'react';
import { api } from '../api.js';

const KNOWLEDGE_CATEGORIES = [
  ['deadline', 'Deadline'],
  ['exam', 'Exam'],
  ['event', 'Event'],
  ['faculty', 'Faculty / staff'],
  ['faq', 'FAQ'],
  ['other', 'Other']
];
const STATUSES = [
  ['open', 'Open'],
  ['in_progress', 'In progress'],
  ['resolved', 'Resolved']
];
const label = (list, value) => (list.find(([v]) => v === value) || [value, value])[1];
const day = (iso) => (iso ? new Date(iso).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) : '');

export default function Admin({ adminKey, setAdminKey }) {
  const [keyInput, setKeyInput] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('knowledge');

  async function login(e) {
    e.preventDefault();
    setError('');
    try {
      await api.listIssues(keyInput); // any admin-only call works as a key check
      setAdminKey(keyInput);
    } catch (err) {
      setError(err.status === 401 ? 'That admin key is not correct.' : err.message);
    }
  }

  if (!adminKey) {
    return (
      <section className="panel narrow">
        <h2>Staff sign-in</h2>
        <p className="muted">Enter the admin key from the server’s .env file to manage campus data and student reports.</p>
        {error && <div className="note bad" role="alert">{error}</div>}
        <form onSubmit={login} className="form">
          <label>Admin key
            <input type="password" value={keyInput} onChange={(e) => setKeyInput(e.target.value)} required autoComplete="off" />
          </label>
          <button className="btn primary">Sign in</button>
        </form>
      </section>
    );
  }

  const onAuthError = () => setAdminKey('');

  return (
    <section className="panel wide">
      <div className="row between">
        <div className="subtabs">
          <button className={view === 'knowledge' ? 'tab active' : 'tab'} onClick={() => setView('knowledge')}>Campus data</button>
          <button className={view === 'issues' ? 'tab active' : 'tab'} onClick={() => setView('issues')}>Student reports</button>
        </div>
        <button className="btn" onClick={() => setAdminKey('')}>Sign out</button>
      </div>
      {view === 'knowledge'
        ? <KnowledgeManager adminKey={adminKey} onAuthError={onAuthError} />
        : <IssueManager adminKey={adminKey} onAuthError={onAuthError} />}
    </section>
  );
}

/* ---------- Campus data (the chatbot's knowledge) ---------- */
const emptyEntry = { title: '', category: 'deadline', date: '', content: '' };

function KnowledgeManager({ adminKey, onAuthError }) {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyEntry);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fail = (err) => (err.status === 401 ? onAuthError() : setError(err.message));
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function load() {
    try { setItems(await api.listKnowledge()); setError(''); } catch (err) { fail(err); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function submit(e) {
    e.preventDefault();
    setError('');
    const payload = { ...form, date: form.date || null };
    try {
      if (editingId) await api.updateKnowledge(editingId, payload, adminKey);
      else await api.createKnowledge(payload, adminKey);
      setForm(emptyEntry); setEditingId(null);
      load();
    } catch (err) { fail(err); }
  }

  function edit(item) {
    setEditingId(item._id);
    setForm({ title: item.title, category: item.category, date: item.date ? item.date.slice(0, 10) : '', content: item.content });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function remove(item) {
    if (!window.confirm(`Delete “${item.title}”?`)) return;
    try { await api.deleteKnowledge(item._id, adminKey); if (editingId === item._id) { setForm(emptyEntry); setEditingId(null); } load(); } catch (err) { fail(err); }
  }

  return (
    <>
      <p className="muted">Everything here is given to the chatbot as its source of truth. Keep dates and names current.</p>
      {error && <div className="note bad" role="alert">{error}</div>}

      <form onSubmit={submit} className="form card">
        <h3>{editingId ? 'Edit entry' : 'Add an entry'}</h3>
        <div className="grid2">
          <label>Title
            <input value={form.title} onChange={set('title')} required maxLength={200} placeholder="Semester fee payment last date" />
          </label>
          <label>Type
            <select value={form.category} onChange={set('category')}>
              {KNOWLEDGE_CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        </div>
        <label>Date <span className="muted">(optional)</span>
          <input type="date" value={form.date} onChange={set('date')} />
        </label>
        <label>Details
          <textarea rows={4} value={form.content} onChange={set('content')} required maxLength={3000} placeholder="What students need to know, where to go, who to contact." />
        </label>
        <div className="row">
          <button className="btn primary">{editingId ? 'Save changes' : 'Add entry'}</button>
          {editingId && <button type="button" className="btn" onClick={() => { setForm(emptyEntry); setEditingId(null); }}>Cancel</button>}
        </div>
      </form>

      {loading ? <p className="muted">Loading…</p> : items.length === 0 ? (
        <p className="muted">No entries yet. Add one above, or run <code>npm run seed</code> in the server folder for sample data.</p>
      ) : (
        <ul className="list">
          {items.map((it) => (
            <li key={it._id} className="item">
              <div className="item-main">
                <div className="item-head">
                  <strong>{it.title}</strong>
                  <span className="tag">{label(KNOWLEDGE_CATEGORIES, it.category)}</span>
                  {it.date && <span className="muted">{day(it.date)}</span>}
                </div>
                <p>{it.content}</p>
              </div>
              <div className="item-actions">
                <button className="btn small" onClick={() => edit(it)}>Edit</button>
                <button className="btn small danger" onClick={() => remove(it)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

/* ---------- Student reports ---------- */
function IssueManager({ adminKey, onAuthError }) {
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const fail = (err) => (err.status === 401 ? onAuthError() : setError(err.message));

  async function load() {
    try { setItems(await api.listIssues(adminKey)); setError(''); } catch (err) { fail(err); } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function changeStatus(item, status) {
    try { await api.updateIssue(item._id, status, adminKey); load(); } catch (err) { fail(err); }
  }
  async function remove(item) {
    if (!window.confirm('Delete this report?')) return;
    try { await api.deleteIssue(item._id, adminKey); load(); } catch (err) { fail(err); }
  }

  if (loading) return <p className="muted">Loading…</p>;

  return (
    <>
      {error && <div className="note bad" role="alert">{error}</div>}
      {items.length === 0 ? <p className="muted">No reports yet.</p> : (
        <ul className="list">
          {items.map((it) => (
            <li key={it._id} className="item">
              <div className="item-main">
                <div className="item-head">
                  <strong>{it.studentName}</strong>
                  <a href={`mailto:${it.email}`}>{it.email}</a>
                  <span className="tag">{it.category}</span>
                  <span className="muted">{day(it.createdAt)}</span>
                </div>
                <p>{it.description}</p>
              </div>
              <div className="item-actions">
                <select value={it.status} onChange={(e) => changeStatus(it, e.target.value)} aria-label="Status" className={`status ${it.status}`}>
                  {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
                <button className="btn small danger" onClick={() => remove(it)}>Delete</button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
