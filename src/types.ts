export interface VerificationCheck {
  name: string;
  passed: boolean;
  metric: string;
  threshold: string;
  detail: string;
}

export interface QualityAdvisory {
  status: 'good' | 'bad';
  classification: string;
  classification_label: string;
  title: string;
  note: string;
  physics_rule: string;
  hardware_diagnostic: string;
  action_directive: string;
  urgency: 'Nominal' | 'Advisory' | 'Urgent' | 'Critical';
  verification_checks: VerificationCheck[];
}

export interface Station {
  location_id: number;
  name: string;
  short_name?: string;
  location_name?: string;
  city?: string;
  state: string;
  region?: 'North' | 'South' | 'East' | 'West' | 'Central' | 'Himalayan' | 'North-East';
  latitude: number;
  longitude: number;
  elevation_m: number;
  sensor_type: string;
  installation_year?: number;
  model_id?: string;
  nominal_reading?: {
    temperature: number;
    relative_humidity: number;
    surface_pressure: number;
  };
  current_reading?: {
    temperature: number;
    relative_humidity: number;
    surface_pressure: number;
    temperature_change?: number;
    humidity_change?: number;
    pressure_change?: number;
    barometric_trend?: string;
    is_anomaly?: boolean;
    anomaly_type?: string;
  };
  quality_advisory?: QualityAdvisory;
  annual_anomalies?: number;
  annual_readings?: number;
}

export interface WeatherRecord {
  location_id: number;
  station_name: string;
  time: string;
  temperature: number;
  relative_humidity: number;
  surface_pressure: number;
  is_missing: boolean;
  range_fault: boolean;
  latitude: number;
  longitude: number;
  temperature_change: number;
  humidity_change: number;
  pressure_change: number;
  temperature_rolling_mean: number;
  humidity_rolling_mean: number;
  pressure_rolling_mean: number;
  temperature_deviation: number;
  humidity_deviation: number;
  pressure_deviation: number;
  hour: number;
  month: number;
  is_anomaly?: boolean;
  anomaly_type?: string;
  dew_point?: number;
  heat_index?: number;
  vapor_pressure_deficit?: number;
  pressure_tendency_3h?: number;
  barometric_trend?: 'Steady' | 'Rising' | 'Falling' | 'Rapid Drop' | 'Rapid Rise';
  is_simulated?: boolean;
  quality_advisory?: QualityAdvisory;
  raw_temperature?: number;
  raw_humidity?: number;
  raw_pressure?: number;
  cleaned_temperature?: number;
  cleaned_humidity?: number;
  cleaned_pressure?: number;
  delta_temperature?: number;
  delta_humidity?: number;
  delta_pressure?: number;
  imputation_method?: string;
  qc_flag?: 'PASS' | 'SUSPECT' | 'ERRONEOUS';
}

export interface AnomalyAlert {
  id: string;
  location_id: number;
  station_name: string;
  time: string;
  temperature: number;
  humidity: number;
  pressure: number;
  // Raw vs Cleaned Ground Truth & Imputation Comparison
  raw_temperature?: number;
  raw_humidity?: number;
  raw_pressure?: number;
  cleaned_temperature?: number;
  cleaned_humidity?: number;
  cleaned_pressure?: number;
  delta_temperature?: number;
  delta_humidity?: number;
  delta_pressure?: number;
  imputation_method?: string;
  qc_flag?: 'PASS' | 'SUSPECT' | 'ERRONEOUS';
  row_verdict?: 'WRONG' | 'RIGHT';
  detection_layers_triggered?: string[];
  status: 'anomaly' | 'nominal';
  type: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  severity_score: number;
  confidence: number;
  explanation: string;
  sensor_health: 'Healthy' | 'Warning' | 'Critical';
  is_simulated?: boolean;
  triage_status?: 'Open' | 'Investigating' | 'Verified Fault' | 'Resolved' | 'False Alarm';
  technician_notes?: string;
  updated_at?: string;
  quality_advisory?: QualityAdvisory;
}

export interface AlertsResponse {
  status: string;
  summary: {
    total_readings: number;
    normal_readings: number;
    anomalies: number;
    anomaly_percentage: number;
    station_health: 'Healthy' | 'Warning' | 'Critical';
    open_incidents?: number;
    resolved_incidents?: number;
    annual_baseline_anomalies?: number;
    annual_baseline_readings?: number;
    annual_anomaly_rate?: number;
  };
  alerts: AnomalyAlert[];
}

export interface StationHealthSummary {
  location_id: number;
  station_name: string;
  short_name?: string;
  location_name?: string;
  nominal_reading?: {
    temperature: number;
    relative_humidity: number;
    surface_pressure: number;
  };
  current_reading?: {
    temperature: number;
    relative_humidity: number;
    surface_pressure: number;
    temperature_change?: number;
    humidity_change?: number;
    pressure_change?: number;
    barometric_trend?: string;
    is_anomaly?: boolean;
    anomaly_type?: string;
  };
  quality_advisory?: QualityAdvisory;
  region?: string;
  total_readings: number;
  anomalies: number;
  missing_readings: number;
  stuck_sensor_events: number;
  anomaly_rate: number;
  missing_rate: number;
  health_score: number;
  health_status: 'Healthy' | 'Warning' | 'Critical';
  avg_temperature?: number;
  avg_humidity?: number;
  avg_pressure?: number;
  maintenance_recommendation?: string;
}

export interface DiurnalHourStats {
  hour: number;
  avg_temp: number;
  min_temp: number;
  max_temp: number;
  avg_humidity: number;
  avg_pressure: number;
  anomaly_count: number;
}

export interface MonthlyStats {
  month: number;
  month_name: string;
  avg_temp: number;
  avg_humidity: number;
  avg_pressure: number;
  anomaly_count: number;
  stuck_sensor_count: number;
}

export interface TuningConfig {
  sensitivity: number;
  tempThreshold: number;
  humThreshold: number;
  pressThreshold: number;
}

export interface ModelLayerDiagnostic {
  id: string;
  name: string;
  status: 'PASS' | 'FLAGGED' | 'WARNING';
  metric: string;
  threshold: string;
  details: string;
}

export interface FeatureImportance {
  feature: string;
  weight_pct: number;
  contribution: string;
}

export interface ModelEvaluationResult {
  is_anomaly: boolean;
  anomaly_type: string;
  confidence: number;
  severity: 'Critical' | 'High' | 'Medium' | 'Low' | 'Nominal';
  severity_score: number;
  explanation: string;
  derived_metrics: {
    dew_point: number;
    heat_index: number;
    vapor_pressure_deficit: number;
    temperature_delta: number;
    humidity_delta: number;
    pressure_delta: number;
    z_score_temp: number;
    z_score_hum: number;
    z_score_press: number;
  };
  layer_diagnostics: ModelLayerDiagnostic[];
  feature_importance: FeatureImportance[];
  ensemble_votes: {
    physical_bounds: boolean;
    rate_of_change: boolean;
    statistical_zscore: boolean;
    psychrometric_rule: boolean;
    isolation_forest: boolean;
  };
  quality_advisory?: QualityAdvisory;
  inference_time_ms: number;
}

export interface BenchmarkTestCase {
  id: string;
  name: string;
  category: string;
  expected_anomaly: boolean;
  predicted_anomaly: boolean;
  passed: boolean;
  confidence: number;
  latency_ms: number;
  explanation: string;
  inputs: {
    temp: number;
    hum: number;
    press: number;
  };
}

export interface BenchmarkSuiteResult {
  total_tests: number;
  passed: number;
  accuracy_pct: number;
  precision_pct: number;
  recall_pct: number;
  f1_score_pct: number;
  avg_latency_ms: number;
  tests: BenchmarkTestCase[];
}
