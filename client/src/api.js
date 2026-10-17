const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed: ${res.status}`);
    err.status = res.status;
    err.errors = body.errors;
    throw err;
  }
  return res.json();
}

export const api = {
  getCandidates: (params = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
    return request(`/candidates${qs ? `?${qs}` : ''}`);
  },
  getCandidate: (id) => request(`/candidates/${id}`),
  createCandidate: (data) => request('/candidates', { method: 'POST', body: JSON.stringify(data) }),
  updateCandidate: (id, data) => request(`/candidates/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCandidate: (id) => request(`/candidates/${id}`, { method: 'DELETE' }),
  moveStage: (id, stage, note) => request(`/candidates/${id}/stage`, { method: 'POST', body: JSON.stringify({ stage, note }) }),
  getFilters: () => request('/candidates/meta/filters'),
  getMetrics: () => request('/dashboard/metrics'),
};
