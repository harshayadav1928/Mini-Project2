
/*
  # MLOpsFlow Core Database Schema

  ## New Tables
  - `customers` - Raw customer data with churn labels
  - `ml_experiments` - Tracks MLflow-style experiment runs
  - `ml_models` - Registered model versions
  - `predictions` - Churn prediction logs
  - `pipeline_runs` - Airflow-style DAG run history
  - `data_drift_alerts` - Monitoring alerts for data drift

  ## Security
  - RLS enabled on all tables
  - Public read access for dashboard data
  - Authenticated insert/update for pipeline operations
*/

-- Customers table with churn features
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id text UNIQUE NOT NULL,
  age integer NOT NULL,
  gender text NOT NULL,
  tenure_months integer NOT NULL,
  monthly_charges numeric(10,2) NOT NULL,
  total_charges numeric(12,2) NOT NULL,
  contract_type text NOT NULL,
  payment_method text NOT NULL,
  internet_service text NOT NULL,
  online_security boolean DEFAULT false,
  tech_support boolean DEFAULT false,
  streaming_tv boolean DEFAULT false,
  streaming_movies boolean DEFAULT false,
  paperless_billing boolean DEFAULT false,
  num_products integer DEFAULT 1,
  satisfaction_score integer,
  support_calls integer DEFAULT 0,
  churn boolean NOT NULL DEFAULT false,
  churn_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customers are publicly readable"
  ON customers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert customers"
  ON customers FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update customers"
  ON customers FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- ML Experiments tracking
CREATE TABLE IF NOT EXISTS ml_experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_name text NOT NULL,
  run_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'running',
  algorithm text NOT NULL,
  dataset_version text,
  params jsonb DEFAULT '{}',
  metrics jsonb DEFAULT '{}',
  tags jsonb DEFAULT '{}',
  artifact_uri text,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration_seconds numeric,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ml_experiments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Experiments are publicly readable"
  ON ml_experiments FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert experiments"
  ON ml_experiments FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update experiments"
  ON ml_experiments FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Registered ML Models
CREATE TABLE IF NOT EXISTS ml_models (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  version text NOT NULL,
  stage text NOT NULL DEFAULT 'staging',
  experiment_run_id text REFERENCES ml_experiments(run_id),
  accuracy numeric(6,4),
  precision_score numeric(6,4),
  recall numeric(6,4),
  f1_score numeric(6,4),
  auc_roc numeric(6,4),
  feature_importance jsonb DEFAULT '{}',
  is_active boolean DEFAULT false,
  deployed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  UNIQUE(model_name, version)
);

ALTER TABLE ml_models ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Models are publicly readable"
  ON ml_models FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert models"
  ON ml_models FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update models"
  ON ml_models FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Prediction Logs
CREATE TABLE IF NOT EXISTS predictions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prediction_id text UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  customer_id text,
  model_version text,
  input_features jsonb NOT NULL,
  churn_probability numeric(6,4) NOT NULL,
  churn_predicted boolean NOT NULL,
  risk_segment text NOT NULL,
  latency_ms integer,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE predictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Predictions are publicly readable"
  ON predictions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert predictions"
  ON predictions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Pipeline Run History
CREATE TABLE IF NOT EXISTS pipeline_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dag_id text NOT NULL,
  run_id text UNIQUE NOT NULL,
  status text NOT NULL DEFAULT 'running',
  trigger_type text NOT NULL DEFAULT 'scheduled',
  tasks_total integer DEFAULT 0,
  tasks_succeeded integer DEFAULT 0,
  tasks_failed integer DEFAULT 0,
  start_time timestamptz DEFAULT now(),
  end_time timestamptz,
  duration_seconds numeric,
  logs text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE pipeline_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Pipeline runs are publicly readable"
  ON pipeline_runs FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert pipeline runs"
  ON pipeline_runs FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update pipeline runs"
  ON pipeline_runs FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Data Drift Monitoring Alerts
CREATE TABLE IF NOT EXISTS data_drift_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_name text NOT NULL,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'medium',
  baseline_mean numeric,
  current_mean numeric,
  drift_score numeric,
  threshold numeric DEFAULT 0.1,
  is_resolved boolean DEFAULT false,
  detected_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE data_drift_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Alerts are publicly readable"
  ON data_drift_alerts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can insert alerts"
  ON data_drift_alerts FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated users can update alerts"
  ON data_drift_alerts FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
