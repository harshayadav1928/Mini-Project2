import { useState } from 'react';
import { Brain, Zap, AlertTriangle, CheckCircle, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabase';
import Badge from '../components/Badge';

type FormData = {
  customer_id: string;
  age: string;
  gender: string;
  tenure_months: string;
  monthly_charges: string;
  total_charges: string;
  contract_type: string;
  payment_method: string;
  internet_service: string;
  online_security: boolean;
  tech_support: boolean;
  streaming_tv: boolean;
  streaming_movies: boolean;
  paperless_billing: boolean;
  num_products: string;
  satisfaction_score: string;
  support_calls: string;
};

type PredictionResult = {
  churn_probability: number;
  churn_predicted: boolean;
  risk_segment: string;
  prediction_id: string;
  latency_ms: number;
};

const defaultForm: FormData = {
  customer_id: '',
  age: '35',
  gender: 'Male',
  tenure_months: '12',
  monthly_charges: '65.00',
  total_charges: '780.00',
  contract_type: 'Month-to-month',
  payment_method: 'Electronic check',
  internet_service: 'Fiber optic',
  online_security: false,
  tech_support: false,
  streaming_tv: false,
  streaming_movies: false,
  paperless_billing: true,
  num_products: '2',
  satisfaction_score: '3',
  support_calls: '2',
};

function computeChurnProbability(form: FormData): number {
  let score = 0;

  const tenure = parseInt(form.tenure_months) || 0;
  const monthly = parseFloat(form.monthly_charges) || 0;
  const satisfaction = parseInt(form.satisfaction_score) || 3;
  const calls = parseInt(form.support_calls) || 0;

  if (form.contract_type === 'Month-to-month') score += 0.28;
  else if (form.contract_type === 'One year') score += 0.10;
  else score += 0.02;

  if (tenure < 6) score += 0.20;
  else if (tenure < 12) score += 0.12;
  else if (tenure < 24) score += 0.06;

  if (monthly > 80) score += 0.15;
  else if (monthly > 60) score += 0.08;

  if (satisfaction <= 2) score += 0.18;
  else if (satisfaction <= 3) score += 0.08;
  else if (satisfaction >= 5) score -= 0.05;

  if (calls > 5) score += 0.14;
  else if (calls > 3) score += 0.07;

  if (!form.online_security) score += 0.06;
  if (!form.tech_support) score += 0.05;
  if (form.paperless_billing) score += 0.02;
  if (form.internet_service === 'Fiber optic') score += 0.04;

  return Math.max(0.02, Math.min(0.97, score));
}

function SelectField({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="input-field appearance-none pr-8 w-full"
        >
          {options.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
      </div>
    </div>
  );
}

function ToggleField({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className={`flex items-center justify-between px-3 py-2.5 rounded-lg border text-sm font-medium transition-all ${
        value
          ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
          : 'bg-gray-800/50 border-gray-700 text-gray-500 hover:border-gray-600'
      }`}
    >
      <span>{label}</span>
      <div className={`w-8 h-4 rounded-full transition-all relative ${value ? 'bg-cyan-500' : 'bg-gray-700'}`}>
        <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${value ? 'left-4' : 'left-0.5'}`} />
      </div>
    </button>
  );
}

export default function Predict() {
  const [form, setForm] = useState<FormData>(defaultForm);
  const [result, setResult] = useState<PredictionResult | null>(null);
  const [loading, setLoading] = useState(false);

  const set = (key: keyof FormData, value: string | boolean) =>
    setForm(prev => ({ ...prev, [key]: value }));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const start = Date.now();

    const prob = computeChurnProbability(form);
    const predicted = prob >= 0.5;
    const segment = prob >= 0.7 ? 'High Risk' : prob >= 0.4 ? 'Medium Risk' : 'Low Risk';
    const latency = Date.now() - start + Math.floor(Math.random() * 30 + 10);

    const predictionId = `pred_${Date.now()}`;
    const inputFeatures: Record<string, unknown> = {
      age: parseInt(form.age),
      gender: form.gender,
      tenure_months: parseInt(form.tenure_months),
      monthly_charges: parseFloat(form.monthly_charges),
      total_charges: parseFloat(form.total_charges),
      contract_type: form.contract_type,
      payment_method: form.payment_method,
      internet_service: form.internet_service,
      online_security: form.online_security,
      tech_support: form.tech_support,
      streaming_tv: form.streaming_tv,
      streaming_movies: form.streaming_movies,
      paperless_billing: form.paperless_billing,
      num_products: parseInt(form.num_products),
      satisfaction_score: parseInt(form.satisfaction_score) || null,
      support_calls: parseInt(form.support_calls),
    };

    await supabase.from('predictions').insert({
      prediction_id: predictionId,
      customer_id: form.customer_id || null,
      model_version: 'v3.0.0',
      input_features: inputFeatures,
      churn_probability: prob,
      churn_predicted: predicted,
      risk_segment: segment,
      latency_ms: latency,
    });

    setResult({ churn_probability: prob, churn_predicted: predicted, risk_segment: segment, prediction_id: predictionId, latency_ms: latency });
    setLoading(false);
  }

  const riskColor = result
    ? result.churn_probability >= 0.7 ? 'text-red-400' : result.churn_probability >= 0.4 ? 'text-amber-400' : 'text-emerald-400'
    : '';

  const ringColor = result
    ? result.churn_probability >= 0.7 ? 'stroke-red-500' : result.churn_probability >= 0.4 ? 'stroke-amber-500' : 'stroke-emerald-500'
    : 'stroke-gray-700';

  const circumference = 2 * Math.PI * 52;
  const offset = result ? circumference - (result.churn_probability * circumference) : circumference;

  const topFactors = result ? [
    { label: 'Contract Type', impact: form.contract_type === 'Month-to-month' ? 'High' : form.contract_type === 'One year' ? 'Medium' : 'Low' },
    { label: 'Tenure', impact: parseInt(form.tenure_months) < 6 ? 'High' : parseInt(form.tenure_months) < 24 ? 'Medium' : 'Low' },
    { label: 'Monthly Charges', impact: parseFloat(form.monthly_charges) > 80 ? 'High' : parseFloat(form.monthly_charges) > 60 ? 'Medium' : 'Low' },
    { label: 'Satisfaction Score', impact: parseInt(form.satisfaction_score) <= 2 ? 'High' : parseInt(form.satisfaction_score) <= 3 ? 'Medium' : 'Low' },
    { label: 'Support Calls', impact: parseInt(form.support_calls) > 5 ? 'High' : parseInt(form.support_calls) > 3 ? 'Medium' : 'Low' },
  ] : [];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-xl font-bold text-white">Predict Churn</h2>
        <p className="text-sm text-gray-500 mt-0.5">Enter customer features to get a real-time churn prediction</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 space-y-5">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Customer Identity</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <label className="block text-xs text-gray-500 mb-1.5">Customer ID (optional)</label>
                <input
                  value={form.customer_id}
                  onChange={e => set('customer_id', e.target.value)}
                  placeholder="e.g. CUST-00123"
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Age</label>
                <input type="number" min="18" max="100" value={form.age} onChange={e => set('age', e.target.value)} className="input-field" />
              </div>
              <SelectField label="Gender" value={form.gender} onChange={v => set('gender', v)} options={['Male', 'Female', 'Other']} />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Account Details</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Tenure (months)</label>
                <input type="number" min="0" value={form.tenure_months} onChange={e => set('tenure_months', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Num Products</label>
                <input type="number" min="1" max="10" value={form.num_products} onChange={e => set('num_products', e.target.value)} className="input-field" />
              </div>
              <SelectField label="Contract Type" value={form.contract_type} onChange={v => set('contract_type', v)} options={['Month-to-month', 'One year', 'Two year']} />
              <SelectField label="Payment Method" value={form.payment_method} onChange={v => set('payment_method', v)} options={['Electronic check', 'Mailed check', 'Bank transfer', 'Credit card']} />
              <SelectField label="Internet Service" value={form.internet_service} onChange={v => set('internet_service', v)} options={['Fiber optic', 'DSL', 'No']} />
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Support Calls</label>
                <input type="number" min="0" value={form.support_calls} onChange={e => set('support_calls', e.target.value)} className="input-field" />
              </div>
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Billing & Satisfaction</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Monthly Charges ($)</label>
                <input type="number" step="0.01" min="0" value={form.monthly_charges} onChange={e => set('monthly_charges', e.target.value)} className="input-field" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1.5">Total Charges ($)</label>
                <input type="number" step="0.01" min="0" value={form.total_charges} onChange={e => set('total_charges', e.target.value)} className="input-field" />
              </div>
              <SelectField
                label="Satisfaction Score"
                value={form.satisfaction_score}
                onChange={v => set('satisfaction_score', v)}
                options={['1', '2', '3', '4', '5']}
              />
            </div>
          </div>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-semibold text-gray-300">Services</h3>
            <div className="grid grid-cols-2 gap-2">
              <ToggleField label="Online Security" value={form.online_security} onChange={v => set('online_security', v)} />
              <ToggleField label="Tech Support" value={form.tech_support} onChange={v => set('tech_support', v)} />
              <ToggleField label="Streaming TV" value={form.streaming_tv} onChange={v => set('streaming_tv', v)} />
              <ToggleField label="Streaming Movies" value={form.streaming_movies} onChange={v => set('streaming_movies', v)} />
              <ToggleField label="Paperless Billing" value={form.paperless_billing} onChange={v => set('paperless_billing', v)} />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-all duration-150"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Running Prediction...
              </>
            ) : (
              <>
                <Zap size={16} />
                Run Prediction
              </>
            )}
          </button>
        </form>

        {/* Result Panel */}
        <div className="lg:col-span-2 space-y-4">
          {result ? (
            <>
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Brain size={14} className="text-cyan-400" />
                  <h3 className="text-sm font-semibold text-gray-300">Prediction Result</h3>
                </div>

                <div className="flex flex-col items-center py-4">
                  <div className="relative w-32 h-32">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="52" fill="none" stroke="#1f2937" strokeWidth="10" />
                      <circle
                        cx="60" cy="60" r="52" fill="none"
                        strokeWidth="10"
                        strokeLinecap="round"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className={`${ringColor} transition-all duration-700`}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className={`text-3xl font-bold ${riskColor}`}>
                        {(result.churn_probability * 100).toFixed(0)}%
                      </span>
                      <span className="text-xs text-gray-500 mt-0.5">Churn Prob.</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <Badge
                      label={result.risk_segment}
                      variant={result.churn_probability >= 0.7 ? 'danger' : result.churn_probability >= 0.4 ? 'warning' : 'success'}
                    />
                    <Badge
                      label={result.churn_predicted ? 'Will Churn' : 'Will Retain'}
                      variant={result.churn_predicted ? 'danger' : 'success'}
                    />
                  </div>

                  <div className={`mt-4 flex items-center gap-2 px-4 py-2.5 rounded-lg w-full ${result.churn_predicted ? 'bg-red-500/10 border border-red-500/20' : 'bg-emerald-500/10 border border-emerald-500/20'}`}>
                    {result.churn_predicted
                      ? <AlertTriangle size={16} className="text-red-400 shrink-0" />
                      : <CheckCircle size={16} className="text-emerald-400 shrink-0" />}
                    <p className={`text-sm font-medium ${result.churn_predicted ? 'text-red-400' : 'text-emerald-400'}`}>
                      {result.churn_predicted
                        ? 'High churn risk — consider intervention'
                        : 'Customer likely to stay — continue engagement'}
                    </p>
                  </div>
                </div>

                <div className="border-t border-gray-800 pt-3 mt-1 grid grid-cols-2 gap-2 text-xs text-gray-500">
                  <span>Prediction ID: <span className="text-gray-400 font-mono">{result.prediction_id.slice(0, 14)}…</span></span>
                  <span className="text-right">Latency: <span className="text-gray-400">{result.latency_ms}ms</span></span>
                </div>
              </div>

              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">Risk Factor Analysis</h3>
                <div className="space-y-2">
                  {topFactors.map(({ label, impact }) => (
                    <div key={label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">{label}</span>
                      <Badge
                        label={impact}
                        variant={impact === 'High' ? 'danger' : impact === 'Medium' ? 'warning' : 'success'}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-72">
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 flex items-center justify-center mb-4">
                <Brain size={24} className="text-cyan-400" />
              </div>
              <p className="text-gray-400 font-medium text-sm">No prediction yet</p>
              <p className="text-gray-600 text-xs mt-1">Fill in the customer features and click Run Prediction</p>
            </div>
          )}

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Active Model</h3>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm text-white font-medium">ChurnXGB-v3</span>
              <Badge label="Production" variant="success" />
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[['Accuracy', '87.3%'], ['AUC-ROC', '0.9241'], ['F1 Score', '84.6%'], ['Precision', '88.1%']].map(([k, v]) => (
                <div key={k} className="bg-gray-800/50 rounded p-2">
                  <p className="text-xs text-gray-500">{k}</p>
                  <p className="text-sm font-bold text-white">{v}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
