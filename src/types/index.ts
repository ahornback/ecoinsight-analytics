export interface MonitoringStation {
  id: string;
  name: string;
  epaAqsId: string;
  county: string;
  city: string;
  latitude: number;
  longitude: number;
  elevationMeters: number;
  monitorType: 'FEM BAM-1020' | 'FRM Filter-based' | 'TEOM Continuous' | 'Optical Particle Counter';
  stationClassification: 'Core Ambient Monitor' | 'Special Purpose Monitor' | 'Near-Road Station';
  operator: string;
  address: string;
  description: string;
}

export interface PM25Observation {
  timestamp: string; // ISO string
  formattedTime: string;
  pm25: number; // in µg/m³
  aqi: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  qualityFlag: 'Valid' | 'Estimated' | 'Suspect' | 'Missing';
  pm10?: number;
  isObserved: true;
}

export interface PM25ForecastPoint {
  hourIndex: number; // 1 to 24
  timestamp: string;
  formattedTime: string;
  pm25Predicted: number; // Deterministic numerical model estimate in µg/m³
  aqiPredicted: number;
  aqiCategory: 'Good' | 'Moderate' | 'Unhealthy for Sensitive Groups' | 'Unhealthy' | 'Very Unhealthy' | 'Hazardous';
  modelSource: string;
  predictionType: 'Deterministic Numerical Model Point Estimate';
  isObserved: false;
}

export interface DataQualityReport {
  stationId: string;
  stationName: string;
  rawRecordsCount: number; // Total raw entries received in payload from upstream API
  rawRecordsBreakdown: string; // Explanation: 168 historical window slots + 24 forecast hours + boundary hours
  expectedHourlySlots: number; // Expected unique hourly slots in requested historical window
  validHourlyObservations: number; // Unique hourly slots in historical window with valid measurements
  missingHourlySlots: number; // Expected slots lacking valid data in historical window
  duplicateTimestampsCount: number; // Duplicate timestamps detected and filtered
  completenessPercent: number; // Strictly: (validHourlyObservations / expectedHourlySlots) * 100
  meetsCompletenessBenchmark: boolean; // >= 75% informational benchmark based on EPA 40 CFR Part 50 guideline
  windowStartTimestamp: string;
  windowEndTimestamp: string;
  latestObservationTimestamp: string;
  hoursSinceLatestObservation: number;
  isStale: boolean;
  staleLevel: 'nominal' | 'warning' | 'critical';
  staleMessage: string;
  anomalyDetected: boolean;
  anomalies: string[];
  warnings: Array<{
    severity: 'info' | 'warning' | 'critical';
    code: string;
    message: string;
  }>;
}

export interface ForecastAvailability {
  available: boolean;
  modelName: string;
  predictionMethodDescription: string;
  runTimestamp: string;
  totalForecastHoursAvailable: number; // Actual hours available (e.g. 24)
  targetHorizonHours: number; // Intended horizon (24)
  reason?: string;
  missingPrerequisites?: string[];
  observationsLatencyHours: number;
}

export interface SummaryStatistics {
  count: number;
  mean: number;
  median: number;
  min: number;
  max: number;
  stdDev: number;
  percentile98: number; // Informational reference metric (EPA 24-hr standard calculation)
  exceedanceCount24hStandard: number; // hours > 35 µg/m³ reference threshold
  exceedanceCountAnnualStandard: number; // hours > 9.0 µg/m³ reference threshold (2024 revised standard)
  dominantCategory: string;
}

export interface DataProvenance {
  providerName: string;
  datasetName: string;
  endpointUrl: string;
  retrievalTimestamp: string; // ISO string when server fetched the payload
  stationIdentifier: string; // EPA AQS ID
  isSyntheticFallbackUsed: false; // Confirms zero synthetic data substitution
}

export type SimulationCondition = 'none' | 'api_failure' | 'missing_observations' | 'stale_data' | 'incomplete_history';

export interface TestModeInfo {
  active: boolean;
  simulationCondition: SimulationCondition;
  simulationTitle: string;
  simulationDescription: string;
  expectedBehavior: string;
}

export interface StationDataResponse {
  station: MonitoringStation;
  dateRange: {
    start: string;
    end: string;
    preset: string;
  };
  provenance: DataProvenance;
  latestObservation: PM25Observation | null;
  historical: PM25Observation[];
  forecast: PM25ForecastPoint[];
  forecastAvailability: ForecastAvailability;
  dataQuality: DataQualityReport;
  statistics: SummaryStatistics;
  sourceAttribution: string;
  testMode?: TestModeInfo;
}

export interface User {
  id: string;
  name: string;
  email: string;
  organization: string;
  role: 'Environmental Consultant' | 'Municipal Sustainability Coordinator' | 'Environmental Data Analyst' | 'Regulatory Compliance Officer';
  createdAt: string;
  defaultStationId?: string;
}

export interface AuthResponse {
  user: User;
  token?: string;
  message: string;
}
