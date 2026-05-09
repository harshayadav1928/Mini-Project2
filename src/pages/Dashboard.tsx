import { useEffect, useState } from 'react';
import { Users, TrendingDown, Cpu, Activity, Target, Zap, Clock, ShieldAlert } from 'lucide-react';
import { supabase, type Customer, type MlModel, type DataDriftAlert } from '../lib/supabase';
import StatCard from '../components/StatCard';
import Badge from '../components/Badge';

type DashboardData = {
  totalCustomers: number;
  churnCount: number;
  churnRate: number;
  activeModel: MlModel | null;
  recentAlerts: DataDriftAlert[];
  churnByContract: Record<string, { total: number; churned: number }>;
  churnByReason: Record<string, number>;
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: customers }, { data: models }, { data: alerts }] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('ml_models').select('*').eq('is_active', true).maybeSingle(),
        supabase.from('data_drift_alerts').select('*').order('detected_at', { ascending: false }).limit(5),
      ]);

      const custs = (customers as Customer[]) ?? [];
      const totalCustomers = custs.length;
      const churnCount = custs.filter(c => c.churn).length;
      const churnRate = totalCustomers > 0 ? (churnCount / totalCustomers) * 100 : 0;

      const churnByContract: Record<string, { total: number; churned: number }> = {};
      const churnByReason: Record<string, number> = {};

      custs.forEach(c => {
        if (!churnByContract[c.contract_type]) churnByContract[c.contract_type] = { total: 0, churned: 0 };
        churnByContract[c.contract_type].total++;
        if (c.churn) {
          churnByContract[c.contract_type].churned++;
          if (c.churn_reason) {
            churnByReason[c.churn_reason] = (churnByReason[c.churn_reason] ?? 0) + 1;
          }
        }
      });

      setData({
        totalCustomers,
        churnCount,
        churnRate,
        activeModel: (models as MlModel) ?? null,
        recentAlerts: (alerts as DataDriftAlert[]) ?? [],
        churnByContract,
        churnByReason,
      });
      setLoading(false);
    }
    load();
  }, []);

  if (loading) return <LoadingSkeleton />;

  const model = data!.activeModel;
  const maxReason = Math.max(...Object.values(data!.churnByReason));
  const reasonColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-yellow-500'];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Overview</h2>
        <p className="text-sm text-gray-500 mt-0.5">Customer churn prediction pipeline status</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Customers"
          value={data!.totalCustomers.toLocaleString()}
          subtitle="In database"
          icon={Users}
          iconColor="text-blue-400"
          iconBg="bg-blue-500/10"
        />
        <StatCard
          title="Churn Rate"
          value={`${data!.churnRate.toFixed(1)}%`}
          subtitle={`${data!.churnCount} customers`}
          trend={-2.3}
          icon={TrendingDown}
          iconColor="text-red-400"
          iconBg="bg-red-500/10"
        />
        <StatCard
          title="Model Accuracy"
          value={model ? `${((model.accuracy ?? 0) * 100).toFixed(1)}%` : 'N/A'}
          subtitle={model?.version ?? 'No model'}
          trend={1.8}
          icon={Target}
          iconColor="text-emerald-400"
          iconBg="bg-emerald-500/10"
        />
        <StatCard
          title="AUC-ROC Score"
          value={model ? (model.auc_roc ?? 0).toFixed(4) : 'N/A'}
          subtitle="Production model"
          icon={Activity}
          iconColor="text-cyan-400"
          iconBg="bg-cyan-500/10"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Churn by Contract */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Churn Rate by Contract</h3>
          <div className="space-y-3">
            {Object.entries(data!.churnByContract).map(([contract, stats]) => {
              const rate = stats.total > 0 ? (stats.churned / stats.total) * 100 : 0;
              const barColor = rate > 50 ? 'bg-red-500' : rate > 20 ? 'bg-amber-500' : 'bg-emerald-500';
              return (
                <div key={contract}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{contract}</span>
                    <span className="text-white font-medium">{rate.toFixed(0)}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div className={`h-full ${barColor} rounded-full transition-all duration-500`} style={{ width: `${rate}%` }} />
                  </div>
                  <p className="text-xs text-gray-600 mt-0.5">{stats.churned}/{stats.total} customers</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Churn Reasons */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Churn Reasons</h3>
          <div className="space-y-3">
            {Object.entries(data!.churnByReason)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count], i) => (
                <div key={reason}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{reason}</span>
                    <span className="text-white font-medium">{count}</span>
                  </div>
                  <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${reasonColors[i] ?? 'bg-blue-500'} rounded-full`}
                      style={{ width: `${(count / maxReason) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Active Model */}
        <div className="lg:col-span-1 bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-300">Active Model</h3>
            <Badge label="Production" variant="success" />
          </div>
          {model ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Cpu size={18} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-sm font-bold text-white">{model.model_name}</p>
                  <p className="text-xs text-gray-500">{model.version} · XGBoost</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {[
                  { label: 'Precision', value: model.precision_score },
                  { label: 'Recall', value: model.recall },
                  { label: 'F1 Score', value: model.f1_score },
                  { label: 'AUC-ROC', value: model.auc_roc },
                ].map(({ label, value }) => (
                  <div key={label} className="bg-gray-800/50 rounded-lg p-2">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-sm font-bold text-white">{value !== null ? ((value ?? 0) * 100).toFixed(1) + '%' : 'N/A'}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No active model</p>
          )}
        </div>
      </div>

      {/* Feature Importance + Drift Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {model && Object.keys(model.feature_importance).length > 0 && (
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <Zap size={14} className="text-amber-400" />
              <h3 className="text-sm font-semibold text-gray-300">Feature Importance</h3>
            </div>
            <div className="space-y-2.5">
              {Object.entries(model.feature_importance)
                .sort((a, b) => b[1] - a[1])
                .map(([feature, importance]) => (
                  <div key={feature}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-gray-400 capitalize">{feature.replace(/_/g, ' ')}</span>
                      <span className="text-white font-medium">{(importance * 100).toFixed(1)}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full"
                        style={{ width: `${importance * 100 * 4}%` }}
                      />
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldAlert size={14} className="text-amber-400" />
            <h3 className="text-sm font-semibold text-gray-300">Data Drift Alerts</h3>
          </div>
          <div className="space-y-2.5">
            {data!.recentAlerts.map(alert => (
              <div key={alert.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-800/40 border border-gray-800">
                <div className={`w-2 h-2 rounded-full mt-1 shrink-0 ${alert.severity === 'high' ? 'bg-red-500' : alert.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-medium text-gray-300 capitalize">{alert.feature_name.replace(/_/g, ' ')}</p>
                    <Badge label={alert.is_resolved ? 'Resolved' : alert.severity} variant={alert.is_resolved ? 'success' : alert.severity === 'high' ? 'danger' : 'warning'} />
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 capitalize">{alert.alert_type.replace(/_/g, ' ')}</p>
                  {alert.drift_score !== null && (
                    <p className="text-xs text-gray-600">Drift score: {alert.drift_score.toFixed(3)}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Predictions */}
      <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <Clock size={14} className="text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-300">Recent Prediction Activity</h3>
        </div>
        <RecentPredictions />
      </div>
    </div>
  );
}

function RecentPredictions() {
  const [predictions, setPredictions] = useState<{ churn_probability: number; churn_predicted: boolean; risk_segment: string; customer_id: string | null; latency_ms: number | null; created_at: string }[]>([]);

  useEffect(() => {
    supabase.from('predictions').select('churn_probability, churn_predicted, risk_segment, customer_id, latency_ms, created_at')
      .order('created_at', { ascending: false }).limit(8).then(({ data }) => {
        if (data) setPredictions(data);
      });
  }, []);

  if (!predictions.length) return <p className="text-gray-500 text-sm">No predictions yet.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs text-gray-500 border-b border-gray-800">
            <th className="text-left pb-2 font-medium">Customer</th>
            <th className="text-left pb-2 font-medium">Churn Prob.</th>
            <th className="text-left pb-2 font-medium">Risk</th>
            <th className="text-left pb-2 font-medium">Prediction</th>
            <th className="text-left pb-2 font-medium">Latency</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-800/50">
          {predictions.map((p, i) => (
            <tr key={i} className="hover:bg-gray-800/30 transition-colors">
              <td className="py-2.5 text-gray-400">{p.customer_id ?? 'Anonymous'}</td>
              <td className="py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${p.churn_probability > 0.7 ? 'bg-red-500' : p.churn_probability > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${p.churn_probability * 100}%` }}
                    />
                  </div>
                  <span className="text-white font-medium">{(p.churn_probability * 100).toFixed(0)}%</span>
                </div>
              </td>
              <td className="py-2.5">
                <Badge
                  label={p.risk_segment}
                  variant={p.risk_segment === 'High Risk' ? 'danger' : p.risk_segment === 'Medium Risk' ? 'warning' : 'success'}
                />
              </td>
              <td className="py-2.5">
                <Badge label={p.churn_predicted ? 'Churn' : 'Retain'} variant={p.churn_predicted ? 'danger' : 'success'} />
              </td>
              <td className="py-2.5 text-gray-500">{p.latency_ms ? `${p.latency_ms}ms` : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="p-6 space-y-6">
      <div className="h-7 w-40 bg-gray-800 rounded animate-pulse" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse" />)}
      </div>
    </div>
  );
}
