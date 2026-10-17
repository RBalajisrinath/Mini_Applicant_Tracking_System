import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const STAGE_COLORS = {
  Applied: 'border-t-blue-400',
  Screening: 'border-t-yellow-400',
  Interview: 'border-t-purple-400',
  Offer: 'border-t-orange-400',
  Hired: 'border-t-green-400',
  Rejected: 'border-t-red-400',
};

const BADGE = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-purple-100 text-purple-700',
  Offer: 'bg-orange-100 text-orange-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

export default function Pipeline() {
  const [candidates, setCandidates] = useState([]);
  const [stages, setStages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, opts] = await Promise.all([api.getCandidates(), api.getFilters()]);
      setCandidates(list);
      setStages(opts.stages.filter(s => s !== 'Rejected'));
      setError(null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleMove(candidate, newStage) {
    try {
      await api.moveStage(candidate.id, newStage);
      load();
    } catch (e) {
      setError(e.message);
    }
  }

  if (loading) return <div className="text-gray-400">Loading...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Hiring Pipeline</h2>
        <p className="text-gray-500 mt-1">Drag candidates through stages or use the stage selector on each card.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {stages.map(stage => {
          const stageCandidates = candidates.filter(c => c.stage_name === stage);
          return (
            <div key={stage} className={`bg-white rounded-xl border border-gray-200 border-t-4 ${STAGE_COLORS[stage]} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-sm">{stage}</h3>
                <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-2 py-0.5 rounded-full">{stageCandidates.length}</span>
              </div>
              <div className="space-y-3">
                {stageCandidates.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-4">No candidates</p>
                ) : (
                  stageCandidates.map(c => (
                    <div key={c.id} className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                      <Link to={`/candidates/${c.id}`} className="font-medium text-sm text-indigo-600 hover:underline">{c.name}</Link>
                      <p className="text-xs text-gray-500 mt-0.5">{c.role}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{c.experience_years}y exp</p>
                      <select
                        className="mt-2 w-full text-xs border border-gray-200 rounded px-2 py-1 bg-white"
                        value={c.stage_name}
                        onChange={e => handleMove(c, e.target.value)}
                      >
                        {[...stages, 'Rejected'].map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
