import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Customer = {
  id: string;
  customer_id: string;
  age: number;
  gender: string;
  tenure_months: number;
  monthly_charges: number;
  total_charges: number;
  contract_type: string;
  payment_method: string;
  internet_service: string;
  online_security: boolean;
  tech_support: boolean;
  streaming_tv: boolean;
  streaming_movies: boolean;
  paperless_billing: boolean;
  num_products: number;
  satisfaction_score: number | null;
  support_calls: number;
  churn: boolean;
  churn_reason: string | null;
  created_at: string;
};

export type MlExperiment = {
  id: string;
  experiment_name: string;
  run_id: string;
  status: string;
  algorithm: string;
  dataset_version: string | null;
  params: Record<string, unknown>;
  metrics: Record<string, number>;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
};

export type MlModel = {
  id: string;
  model_name: string;
  version: string;
  stage: string;
  experiment_run_id: string | null;
  accuracy: number | null;
  precision_score: number | null;
  recall: number | null;
  f1_score: number | null;
  auc_roc: number | null;
  feature_importance: Record<string, number>;
  is_active: boolean;
  deployed_at: string | null;
  created_at: string;
};

export type Prediction = {
  id: string;
  prediction_id: string;
  customer_id: string | null;
  model_version: string | null;
  input_features: Record<string, unknown>;
  churn_probability: number;
  churn_predicted: boolean;
  risk_segment: string;
  latency_ms: number | null;
  created_at: string;
};

export type PipelineRun = {
  id: string;
  dag_id: string;
  run_id: string;
  status: string;
  trigger_type: string;
  tasks_total: number;
  tasks_succeeded: number;
  tasks_failed: number;
  start_time: string;
  end_time: string | null;
  duration_seconds: number | null;
};

export type DataDriftAlert = {
  id: string;
  feature_name: string;
  alert_type: string;
  severity: string;
  baseline_mean: number | null;
  current_mean: number | null;
  drift_score: number | null;
  threshold: number | null;
  is_resolved: boolean;
  detected_at: string;
};
