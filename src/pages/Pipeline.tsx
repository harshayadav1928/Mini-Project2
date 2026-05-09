import { useEffect, useState } from 'react';
import { Activity, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, type PipelineRun } from '../lib/supabase';
import Badge from '../components/Badge';

export default function Pipeline() {
  const [runs, setRuns] = useState<PipelineRun[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('pipeline_runs').select('*').order('start_time', { ascending: false }).limit(20);
      setRuns((data as PipelineRun[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-40 bg-gray-800 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Pipeline Runs</h2>
        <p className="text-sm text-gray-500 mt-0.5">Airflow DAG execution history</p>
      </div>

      <div className="space-y-3">
        {runs.map(run => {
          const successRate = run.tasks_total > 0 ? (run.tasks_succeeded / run.tasks_total) * 100 : 0;
          const duration = run.duration_seconds ? `${Math.floor(run.duration_seconds / 60)}m ${Math.floor(run.duration_seconds % 60)}s` : '—';
          const isRunning = !run.end_time;

          return (
            <div key={run.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-bold text-white">{run.run_id}</p>
                    <Badge label={run.dag_id} variant="info" />
                    <Badge
                      label={run.status === 'success' ? 'Success' : run.status === 'running' ? 'Running' : 'Failed'}
                      variant={run.status === 'success' ? 'success' : run.status === 'running' ? 'running' : 'danger'}
                    />
                  </div>
                  <p className="text-xs text-gray-500">
                    {new Date(run.start_time).toLocaleString()} · {run.trigger_type} trigger
                  </p>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-gray-400 mb-1">
                    <Clock size={12} />
                    {duration}
                  </div>
                  {isRunning && (
                    <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse mx-auto" />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Total Tasks</p>
                  <p className="text-lg font-bold text-white">{run.tasks_total}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Succeeded</p>
                  <p className="text-lg font-bold text-emerald-400">{run.tasks_succeeded}</p>
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <p className="text-xs text-gray-500 mb-1">Failed</p>
                  <p className="text-lg font-bold text-red-400">{run.tasks_failed}</p>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-gray-400">Task Success Rate</span>
                  <span className="font-medium text-white">{successRate.toFixed(0)}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${run.status === 'success' ? 'bg-emerald-500' : run.status === 'running' ? 'bg-blue-500' : 'bg-red-500'}`}
                    style={{ width: `${successRate}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
