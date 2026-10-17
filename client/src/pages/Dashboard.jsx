import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

const STAGE_COLORS = {
  Applied: 'bg-blue-100 text-blue-700',
  Screening: 'bg-yellow-100 text-yellow-700',
  Interview: 'bg-purple-100 text-purple-700',
  Offer: 'bg-orange-100 text-orange-700',
  Hired: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
};

function StatCard({ label, value, sub, color }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className={`text-3xl font-bold mt-1 ${color || 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-sm text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getMetrics().then(setMetrics).catch(e => setError(e.message));
  }, []);

  if (error) return <div className="text-red-600">Failed to load dashboard: {error}</div>;
  if (!metrics) return <div className="text-gray-400">Loading...</div>;

  const maxStageCount = Math.max(...metrics.byStage.map(s => s.count), 1);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
        <p className="text-gray-500 mt-1">Hiring pipeline overview</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Candidates" value={metrics.total} />
        <StatCard label="Active" value={metrics.active} color="text-blue-600" sub="In pipeline" />
        <StatCard label="Hired" value={metrics.hired} color="text-green-600" sub={`${metrics.conversionRate}% conversion`} />
        <StatCard label="Avg Experience" value={`${metrics.avgExperience}y`} color="text-purple-600" />
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Candidates by Stage</h3>
          <div className="space-y-3">
            {metrics.byStage.map(s => (
              <div key={s.stage} className="flex items-center gap-3">
                <span className="text-sm font-medium text-gray-600 w-24">{s.stage}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${(s.count / maxStageCount) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-semibold text-gray-700 w-8 text-right">{s.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Candidates by Role</h3>
          <div className="space-y-2">
            {metrics.byRole.slice(0, 8).map(r => (
              <div key={r.role} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700">{r.role}</span>
                <span className="text-sm font-semibold text-gray-900">{r.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            {metrics.recent.map(a => (
              <div key={a.id} className="flex gap-3">
                <div className="w-2 h-2 rounded-full bg-indigo-400 mt-2 shrink-0" />
                <div>
                  <p className="text-sm text-gray-700">
                    <Link to={`/candidates/${a.candidate_id}`} className="font-medium text-indigo-600 hover:underline">
                      {a.candidate_name}
                    </Link>{' '}
                    — {a.message}
                  </p>
                  <p className="text-xs text-gray-400">{new Date(a.created_at + 'Z').toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Newest Candidates</h3>
          <div className="space-y-2">
            {metrics.recentCandidates.map(c => (
              <Link
                key={c.id}
                to={`/candidates/${c.id}`}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0 hover:bg-gray-50 -mx-2 px-2 rounded"
              >
                <div>
                  <p className="text-sm font-medium text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-500">{c.role}</p>
                </div>
                <span className="text-xs text-gray-400">{new Date(c.created_at + 'Z').toLocaleDateString()}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
