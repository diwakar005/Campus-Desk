// All calls to the Express backend live here.
// In development Vite proxies /api to localhost:5000. In production set VITE_API_URL.
const BASE = import.meta.env.VITE_API_URL || '/api';

async function request(path, { method = 'GET', body, adminKey } = {}) {
  const headers = { 'Content-Type': 'application/json' };
  if (adminKey) headers['x-admin-key'] = adminKey;

  let res;
  try {
    res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new Error('Cannot reach the server. Is the backend running?');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const api = {
  // chat
  chat: (message, history, sessionId) => request('/chat', { method: 'POST', body: { message, history, sessionId } }),

  // issues
  reportIssue: (data) => request('/issues', { method: 'POST', body: data }),
  listIssues: (adminKey) => request('/issues', { adminKey }),
  updateIssue: (id, status, adminKey) => request(`/issues/${id}`, { method: 'PUT', body: { status }, adminKey }),
  deleteIssue: (id, adminKey) => request(`/issues/${id}`, { method: 'DELETE', adminKey }),

  // knowledge
  listKnowledge: () => request('/knowledge'),
  createKnowledge: (data, adminKey) => request('/knowledge', { method: 'POST', body: data, adminKey }),
  updateKnowledge: (id, data, adminKey) => request(`/knowledge/${id}`, { method: 'PUT', body: data, adminKey }),
  deleteKnowledge: (id, adminKey) => request(`/knowledge/${id}`, { method: 'DELETE', adminKey })
};
