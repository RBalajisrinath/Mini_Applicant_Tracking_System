import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const STAGE_BADGE = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-purple-100 text-purple-700',
  Offer: 'bg-orange-100 text-orange-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

const EMPTY_FORM = { name: '', email: '', phone: '', role: '', experience_years: 0, skills: '', notes: '' };

export default function Candidates() {
  const [candidates, setCandidates] = useState([]);
  const [filters, setFilters] = useState({ q: '', stage: '', role: '', status: '' });
  const [filterOptions, setFilterOptions] = useState({ stages: [], roles: [] });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, opts] = await Promise.all([api.getCandidates(filters), api.getFilters()]);
      setCandidates(list);
      setFilterOptions(opts);
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { load(); }, [load]);

  async function handleSubmit(e) {
    e.preventDefault();
    setFormErrors([]);
    try {
      await api.createCandidate(form);
      setForm(EMPTY_FORM);
      setShowForm(false);
      load();
    } catch (e) {
      setFormErrors(e.errors || [e.message]);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this candidate?')) return;
    await api.deleteCandidate(id);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Candidates</h2>
          <p className="text-gray-500 mt-1">{candidates.length} candidate{candidates.length !== 1 ? 's' : ''}</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          {showForm ? 'Cancel' : '+ Add Candidate'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input type="email" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.role} onChange={e => setForm({ ...form, role: e.target.value })} placeholder="e.g. Frontend Engineer" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.experience_years} onChange={e => setForm({ ...form, experience_years: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.skills} onChange={e => setForm({ ...form, skills: e.target.value })} placeholder="e.g. React, Node.js" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
          {formErrors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              {formErrors.map((e, i) => <p key={i} className="text-sm text-red-600">{e}</p>)}
            </div>
          )}
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save Candidate</button>
        </form>
      )}

      <div className="flex flex-wrap gap-3">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          placeholder="Search name, email, role, skills..."
          value={filters.q}
          onChange={e => setFilters({ ...filters, q: e.target.value })}
        />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.stage} onChange={e => setFilters({ ...filters, stage: e.target.value })}>
          <option value="">All Stages</option>
          {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.role} onChange={e => setFilters({ ...filters, role: e.target.value })}>
          <option value="">All Roles</option>
          {filterOptions.roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
          <option value="">All Statuses</option>
          <option value="active">Active</option>
          <option value="hired">Hired</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {error && <div className="text-red-600">{error}</div>}
      {loading ? (
        <div className="text-gray-400">Loading...</div>
      ) : candidates.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <p className="text-lg">No candidates found</p>
          <p className="text-sm mt-1">Try adjusting your filters or add a new candidate.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Name</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Role</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Stage</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Experience</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-6 py-3">Applied</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {candidates.map(c => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/candidates/${c.id}`} className="font-medium text-indigo-600 hover:underline">{c.name}</Link>
                    <p className="text-xs text-gray-400">{c.email}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.role}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_BADGE[c.stage_name] || 'bg-gray-100 text-gray-700'}`}>
                      {c.stage_name}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">{c.experience_years}y</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{new Date(c.created_at + 'Z').toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-red-400 hover:text-red-600 text-sm">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
