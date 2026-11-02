import { useEffect, useRef, useState } from 'react';
import { api } from '../api.js';

const SUGGESTIONS = [
  'What is the last date to pay fees?',
  'When are the exams?',
  'What events are coming up?',
  'Who is the Dean of Academics?'
];

// A new id per page load, so chat logs from one visit can be grouped.
const sessionId = Math.random().toString(36).slice(2);

// Turns the model's light markdown (**bold**, "* item") into safe React elements.
function bold(text) {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part
  );
}
function Formatted({ text }) {
  const blocks = [];
  let list = [];
  const flush = () => { if (list.length) { blocks.push(<ul key={blocks.length}>{list}</ul>); list = []; } };
  text.split('\n').forEach((line, i) => {
    const li = line.match(/^\s*[*-]\s+(.*)$/);
    if (li) list.push(<li key={i}>{bold(li[1])}</li>);
    else if (line.trim()) { flush(); blocks.push(<p key={blocks.length}>{bold(line)}</p>); }
    else flush();
  });
  flush();
  return <>{blocks}</>;
}

export default function Chat({ goReport }) {
  const [messages, setMessages] = useState([]); // { role: 'user' | 'assistant', text, error? }
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [messages, busy]);

  async function send(text) {
    const message = text.trim();
    if (!message || busy) return;
    // Only successful turns are sent as history.
    const history = messages.filter((m) => !m.error).map(({ role, text }) => ({ role, text }));
    setMessages((m) => [...m, { role: 'user', text: message }]);
    setInput('');
    setBusy(true);
    try {
      const { reply } = await api.chat(message, history, sessionId);
      setMessages((m) => [...m, { role: 'assistant', text: reply }]);
    } catch (err) {
      setMessages((m) => [...m, { role: 'assistant', text: err.message, error: true }]);
    } finally {
      setBusy(false);
    }
  }

  function onKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); }
  }

  return (
    <section className="chat">
      <div className="log" aria-live="polite">
        {messages.length === 0 && (
          <div className="hello">
            <h2>What can we help you with?</h2>
            <p>Ask about deadlines, exam schedules, events, or where to find a faculty member.</p>
            <div className="chips">
              {SUGGESTIONS.map((s) => (
                <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'bot'}${m.error ? ' err' : ''}`}>
            <div className="bubble">
              {m.role === 'user' ? m.text : m.error ? m.text : <Formatted text={m.text} />}
            </div>
          </div>
        ))}

        {busy && (
          <div className="msg bot">
            <div className="bubble"><span className="dots" aria-label="Thinking"><i /><i /><i /></span></div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="composer-wrap">
        <div className="composer">
          <textarea
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Type your question…"
            aria-label="Your question"
            maxLength={1000}
          />
          <button className="btn primary" onClick={() => send(input)} disabled={busy || !input.trim()}>Send</button>
        </div>
        <p className="fine">
          Answers come from the university’s notes and may be incomplete. Didn’t get what you needed?{' '}
          <button className="link" onClick={goReport}>Report a problem</button>
        </p>
      </div>
    </section>
  );
}
