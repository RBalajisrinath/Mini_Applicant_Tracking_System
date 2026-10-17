import { useEffect, useState, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { api } from '../api';

const STAGE_BADGE = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-purple-100 text-purple-700',
  Offer: 'bg-orange-100 text-orange-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function CandidateDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState(null);
  const [stages, setStages] = useState([]);
  const [moveStage, setMoveStage] = useState('');
  const [moveNote, setMoveNote] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [c, opts] = await Promise.all([api.getCandidate(id), api.getFilters()]);
      setCandidate(c);
      setStages(opts.stages);
      setEditForm({ name: c.name, email: c.email, phone: c.phone || '', role: c.role, experience_years: c.experience_years, skills: c.skills, notes: c.notes });
      setError(null);
    } catch (e) {
      setError(e.message);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function handleMove(e) {
    e.preventDefault();
    if (!moveStage) return;
    try {
      await api.moveStage(id, moveStage, moveNote);
      setMoveStage('');
      setMoveNote('');
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleUpdate(e) {
    e.preventDefault();
    try {
      await api.updateCandidate(id, editForm);
      setEditMode(false);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this candidate?')) return;
    await api.deleteCandidate(id);
    navigate('/candidates');
  }

  if (error) return <div className="text-red-600">{error}</div>;
  if (!candidate) return <div className="text-gray-400">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link to="/candidates" className="text-sm text-indigo-600 hover:underline">&larr; Back to Candidates</Link>
          <h2 className="text-2xl font-bold text-gray-900 mt-2">{candidate.name}</h2>
          <p className="text-gray-500">{candidate.role}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setEditMode(!editMode)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50">
            {editMode ? 'Cancel' : 'Edit'}
          </button>
          <button onClick={handleDelete} className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-medium hover:bg-red-100">
            Delete
          </button>
        </div>
      </div>

      {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-600">{error}</div>}

      {editMode ? (
        <form onSubmit={handleUpdate} className="bg-white rounded-xl border border-gray-200 p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input type="number" min="0" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.experience_years} onChange={e => setEditForm({ ...editForm, experience_years: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
              <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.skills} onChange={e => setEditForm({ ...editForm, skills: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea rows="3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} />
          </div>
          <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700">Save Changes</button>
        </form>
      ) : (
        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Details</h3>
              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div><dt className="text-gray-500">Email</dt><dd className="font-medium text-gray-900">{candidate.email}</dd></div>
                <div><dt className="text-gray-500">Phone</dt><dd className="font-medium text-gray-900">{candidate.phone || '—'}</dd></div>
                <div><dt className="text-gray-500">Experience</dt><dd className="font-medium text-gray-900">{candidate.experience_years} years</dd></div>
                <div><dt className="text-gray-500">Current Stage</dt><dd><span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${STAGE_BADGE[candidate.stage_name]}`}>{candidate.stage_name}</span></dd></div>
                <div className="col-span-2"><dt className="text-gray-500">Skills</dt><dd className="font-medium text-gray-900">{candidate.skills || '—'}</dd></div>
                <div className="col-span-2"><dt className="text-gray-500">Notes</dt><dd className="font-medium text-gray-900">{candidate.notes || '—'}</dd></div>
              </dl>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Activity Timeline</h3>
              <div className="space-y-4">
                {candidate.activities.map(a => (
                  <div key={a.id} className="flex gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 ${a.type === 'stage_change' ? 'bg-indigo-400' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm text-gray-700">{a.message}</p>
                      <p className="text-xs text-gray-400">{new Date(a.created_at + 'Z').toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Move Stage</h3>
              <form onSubmit={handleMove} className="space-y-3">
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={moveStage} onChange={e => setMoveStage(e.target.value)}>
                  <option value="">Select stage...</option>
                  {stages.filter(s => s !== candidate.stage_name).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" placeholder="Note (optional)" value={moveNote} onChange={e => setMoveNote(e.target.value)} />
                <button type="submit" disabled={!moveStage} className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  Move Candidate
                </button>
              </form>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-6">
              <h3 className="font-semibold text-gray-900 mb-3">Pipeline</h3>
              <div className="space-y-2">
                {stages.map(s => (
                  <div key={s} className={`flex items-center gap-2 text-sm ${s === candidate.stage_name ? 'font-semibold text-indigo-600' : 'text-gray-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${s === candidate.stage_name ? 'bg-indigo-500' : 'bg-gray-300'}`} />
                    {s}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
