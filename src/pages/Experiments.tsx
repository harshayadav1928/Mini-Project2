import { useEffect, useState } from 'react';
import { Clock, TrendingUp, Zap, BarChart3 } from 'lucide-react';
import { supabase, type MlExperiment } from '../lib/supabase';
import Badge from '../components/Badge';

export default function Experiments() {
  const [experiments, setExperiments] = useState<MlExperiment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('ml_experiments').select('*').order('start_time', { ascending: false });
      setExperiments((data as MlExperiment[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const groupedByName = experiments.reduce((acc, exp) => {
    if (!acc[exp.experiment_name]) acc[exp.experiment_name] = [];
    acc[exp.experiment_name].push(exp);
    return acc;
  }, {} as Record<string, MlExperiment[]>);

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Experiments</h2>
        <p className="text-sm text-gray-500 mt-0.5">MLflow experiment runs and tracked metrics</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-40 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedByName).map(([name, runs]) => (
            <div key={name}>
              <h3 className="text-sm font-semibold text-gray-300 mb-3 px-1">{name}</h3>
              <div className="space-y-3">
                {runs.map(exp => (
                  <div key={exp.id} className="bg-gray-900 border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition-colors">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white">{exp.run_id}</p>
                          <Badge label={exp.algorithm} variant="info" />
                          <Badge label={exp.status} variant={exp.status === 'finished' ? 'success' : 'running'} />
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {new Date(exp.start_time).toLocaleDateString()} · Dataset {exp.dataset_version}
                        </p>
                      </div>
                      {exp.duration_seconds && (
                        <div className="flex items-center gap-1 text-xs text-gray-400">
                          <Clock size={12} />
                          {Math.floor(exp.duration_seconds / 60)}m {Math.floor(exp.duration_seconds % 60)}s
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {Object.entries(exp.metrics)
                        .sort((a, b) => b[1] - a[1])
                        .slice(0, 4)
                        .map(([metric, value]) => (
                          <div key={metric} className="bg-gray-800/50 rounded-lg p-3">
                            <p className="text-xs text-gray-500 capitalize mb-1">{metric.replace(/_/g, ' ')}</p>
                            <p className="text-sm font-bold text-white">
                              {metric.includes('loss') ? value.toFixed(4) : (value * 100).toFixed(2) + '%'}
                            </p>
                          </div>
                        ))}
                    </div>

                    {Object.keys(exp.params).length > 0 && (
                      <div className="bg-gray-800/30 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">Hyperparameters</p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                          {Object.entries(exp.params)
                            .slice(0, 3)
                            .map(([key, val]) => (
                              <div key={key} className="text-xs">
                                <span className="text-gray-600">{key}:</span>{' '}
                                <span className="text-gray-300 font-medium">{String(val)}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
