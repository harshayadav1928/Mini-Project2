import { useEffect, useState } from 'react';
import { AlertTriangle, TrendingDown, TrendingUp, Calendar, BarChart3 } from 'lucide-react';
import { supabase, type DataDriftAlert } from '../lib/supabase';
import Badge from '../components/Badge';

export default function Monitoring() {
  const [alerts, setAlerts] = useState<DataDriftAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('data_drift_alerts').select('*').order('detected_at', { ascending: false });
      setAlerts((data as DataDriftAlert[]) ?? []);
      setLoading(false);
    }
    load();
  }, []);

  const resolvedCount = alerts.filter(a => a.is_resolved).length;
  const unresolvedCount = alerts.filter(a => !a.is_resolved).length;
  const highSeverity = alerts.filter(a => a.severity === 'high' && !a.is_resolved).length;

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-7 w-40 bg-gray-800 rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Data Drift Monitoring</h2>
        <p className="text-sm text-gray-500 mt-0.5">Feature distribution and data quality alerts</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Total Alerts</p>
            <AlertTriangle size={16} className="text-amber-400" />
          </div>
          <p className="text-2xl font-bold text-white">{alerts.length}</p>
          <p className="text-xs text-gray-500 mt-1">{unresolvedCount} unresolved</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">High Severity</p>
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          </div>
          <p className="text-2xl font-bold text-red-400">{highSeverity}</p>
          <p className="text-xs text-gray-500 mt-1">Requires immediate attention</p>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-400">Resolved</p>
            <CheckIcon size={16} className="text-emerald-400" />
          </div>
          <p className="text-2xl font-bold text-emerald-400">{resolvedCount}</p>
          <p className="text-xs text-gray-500 mt-1">{((resolvedCount / alerts.length) * 100).toFixed(0)}% of all alerts</p>
        </div>
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Alert History</h3>
        {alerts.length === 0 ? (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 text-center">
            <p className="text-gray-500">No alerts detected. System is operating normally.</p>
          </div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className={`bg-gray-900 border rounded-xl p-5 transition-colors ${alert.is_resolved ? 'border-gray-800 opacity-75' : 'border-gray-700 hover:border-gray-600'}`}>
              <div className="flex items-start gap-4">
                <div className={`w-3 h-3 rounded-full mt-1.5 shrink-0 ${alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <p className="font-semibold text-white capitalize">{alert.feature_name.replace(/_/g, ' ')}</p>
                    <Badge label={alert.alert_type.replace(/_/g, ' ')} variant="neutral" />
                    <Badge
                      label={alert.severity}
                      variant={alert.severity === 'high' ? 'danger' : alert.severity === 'medium' ? 'warning' : 'info'}
                    />
                    {alert.is_resolved && <Badge label="Resolved" variant="success" />}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 my-3">
                    {alert.baseline_mean !== null && (
                      <div className="bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500">Baseline</p>
                        <p className="text-sm font-medium text-gray-300">{alert.baseline_mean.toFixed(2)}</p>
                      </div>
                    )}
                    {alert.current_mean !== null && (
                      <div className="bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500">Current</p>
                        <p className="text-sm font-medium text-gray-300">{alert.current_mean.toFixed(2)}</p>
                      </div>
                    )}
                    {alert.drift_score !== null && (
                      <div className="bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500">Drift Score</p>
                        <p className="text-sm font-medium text-amber-400">{alert.drift_score.toFixed(3)}</p>
                      </div>
                    )}
                    {alert.threshold !== null && (
                      <div className="bg-gray-800/50 rounded p-2">
                        <p className="text-xs text-gray-500">Threshold</p>
                        <p className="text-sm font-medium text-cyan-400">{alert.threshold.toFixed(3)}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-1">
                      <Calendar size={12} />
                      Detected: {new Date(alert.detected_at).toLocaleString()}
                    </div>
                    {alert.resolved_at && (
                      <span>Resolved: {new Date(alert.resolved_at).toLocaleString()}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function CheckIcon({ size, className }: { size: number; className: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
