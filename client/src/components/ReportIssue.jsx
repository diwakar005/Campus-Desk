import { useState } from 'react';
import { api } from '../api.js';

const CATEGORIES = [
  ['academic', 'Academics'],
  ['fees', 'Fees and scholarships'],
  ['hostel', 'Hostel and housing'],
  ['it', 'IT and Wi-Fi'],
  ['facilities', 'Campus facilities'],
  ['other', 'Something else']
];

const blank = { studentName: '', email: '', category: 'academic', description: '' };

export default function ReportIssue() {
  const [form, setForm] = useState(blank);
  const [state, setState] = useState({ busy: false, error: '', done: false });

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setState({ busy: true, error: '', done: false });
    try {
      await api.reportIssue(form);
      setForm(blank);
      setState({ busy: false, error: '', done: true });
    } catch (err) {
      setState({ busy: false, error: err.message, done: false });
    }
  }

  return (
    <section className="panel">
      <h2>Report a problem</h2>
      <p className="muted">Tell student support what’s wrong. A staff member will read it and follow up by email.</p>

      {state.done && <div className="note ok" role="status">Thanks, your report was sent. Staff will email you.</div>}
      {state.error && <div className="note bad" role="alert">{state.error}</div>}

      <form onSubmit={submit} className="form">
        <label>Your name
          <input value={form.studentName} onChange={set('studentName')} required maxLength={120} />
        </label>
        <label>University email
          <input type="email" value={form.email} onChange={set('email')} required maxLength={200} />
        </label>
        <label>What is it about?
          <select value={form.category} onChange={set('category')}>
            {CATEGORIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label>Describe the problem
          <textarea rows={5} value={form.description} onChange={set('description')} required maxLength={3000} />
        </label>
        <button className="btn primary" disabled={state.busy}>{state.busy ? 'Sending…' : 'Send report'}</button>
      </form>
    </section>
  );
}
