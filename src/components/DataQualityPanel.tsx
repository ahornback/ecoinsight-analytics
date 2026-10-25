import React from 'react';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Gauge,
  Radio,
  Sliders,
  Database,
  Layers,
  FileText
} from 'lucide-react';
import { DataQualityReport, SimulationCondition } from '../types/index.ts';
import { FlaskConical } from 'lucide-react';
import { isDevEnvironment } from './DeveloperTestingPanel.tsx';

interface DataQualityPanelProps {
  dataQuality: DataQualityReport;
  currentCondition?: SimulationCondition;
  onOpenTestingPanel?: () => void;
  // Backward compatibility
  isSimulatingStale?: boolean;
  onToggleSimulateStale?: () => void;
}

export const DataQualityPanel: React.FC<DataQualityPanelProps> = ({
  dataQuality,
  currentCondition = 'none',
  onOpenTestingPanel,
  isSimulatingStale = false,
  onToggleSimulateStale
}) => {
  const isDev = isDevEnvironment();
  const isTestActive = currentCondition !== 'none';

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-sm mb-6">
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldAlert className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              Data Quality & Ingestion Diagnostics (QA/QC)
            </h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${
                dataQuality.staleLevel === 'nominal'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : dataQuality.staleLevel === 'warning'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-rose-50 text-rose-800 border-rose-300'
              }`}
            >
              {dataQuality.staleLevel === 'nominal'
                ? 'Telemetry Nominal'
                : dataQuality.staleLevel === 'warning'
                ? 'Delayed Stream'
                : 'Stale Stream Warning'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Automated screening against EPA 40 CFR Part 50 informational completeness benchmark and transmission latency
          </p>
        </div>

        {/* Diagnostic Stress Test Controls (dev only) */}
        {isDev && onOpenTestingPanel && (
          <div className="flex items-center space-x-2">
            <button
              onClick={onOpenTestingPanel}
              className={`text-xs px-3 py-1.5 rounded-lg border font-medium flex items-center space-x-1.5 transition-colors cursor-pointer ${
                isTestActive
                  ? 'bg-amber-500 text-white border-amber-600 shadow-sm animate-pulse'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="Open controlled QA failure testing panel to test forecasting gates"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              <span>
                {isTestActive ? `Test Active: ${currentCondition}` : 'QA Failure Testing Panel'}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Grid of 4 Key Record Diagnostics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        {/* Metric 1: Stream Latency */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Stream Latency</span>
            <Clock className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-slate-900">
              {dataQuality.hoursSinceLatestObservation} hrs
            </span>
            <span className="text-xs text-slate-500">delay</span>
          </div>
          <span
            className={`text-[11px] block mt-1 font-medium ${
              dataQuality.staleLevel === 'nominal'
                ? 'text-emerald-700'
                : dataQuality.staleLevel === 'warning'
                ? 'text-amber-700'
                : 'text-rose-700 font-bold'
            }`}
          >
            {dataQuality.staleMessage}
          </span>
        </div>

        {/* Metric 2: Completeness Calculation */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Hourly Completeness</span>
            <Gauge className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-slate-900">
              {dataQuality.completenessPercent}%
            </span>
            <span className="text-xs text-slate-500">
              ({dataQuality.validHourlyObservations}/{dataQuality.expectedHourlySlots} hrs)
            </span>
          </div>
          <span
            className={`text-[11px] block mt-1 font-medium ${
              dataQuality.meetsCompletenessBenchmark ? 'text-emerald-700' : 'text-amber-700'
            }`}
          >
            {dataQuality.meetsCompletenessBenchmark
              ? 'Meets 75% informational benchmark'
              : 'Below 75% reference completeness'}
          </span>
        </div>

        {/* Metric 3: Raw Ingestion vs Valid Bins */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Raw Ingestion Count</span>
            <Database className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-slate-900">
              {dataQuality.rawRecordsCount}
            </span>
            <span className="text-xs text-slate-500">raw entries</span>
          </div>
          <span className="text-[11px] block mt-1 text-slate-600">
            {dataQuality.duplicateTimestampsCount > 0
              ? `${dataQuality.duplicateTimestampsCount} duplicates filtered into ${dataQuality.validHourlyObservations} unique hours`
              : 'Zero duplicate timestamps detected in raw feed'}
          </span>
        </div>

        {/* Metric 4: Missing Hourly Intervals */}
        <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span className="font-semibold uppercase tracking-wider">Missing Slots</span>
            <Radio className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <div className="flex items-baseline space-x-1.5">
            <span className="text-xl font-bold text-slate-900">
              {dataQuality.missingHourlySlots} hrs
            </span>
            <span className="text-xs text-slate-500">unrecorded</span>
          </div>
          <span className="text-[11px] block mt-1 text-slate-600">
            {dataQuality.missingHourlySlots === 0
              ? 'Continuous 100% hourly capture'
              : 'Zero/span calibration or network interval'}
          </span>
        </div>
      </div>

      {/* Warning & Audit Log Table */}
      <div className="bg-slate-50/70 rounded-lg border border-slate-200 overflow-hidden">
        <div className="px-3.5 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
          <span>Active Data Screening & Quality Log</span>
          <span className="text-[10px] font-mono text-slate-500">
            Guideline: EPA 40 CFR Part 50 App. N
          </span>
        </div>

        <div className="p-3 space-y-2">
          {dataQuality.warnings.map((w, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-md border text-xs flex items-start space-x-2.5 ${
                w.severity === 'critical'
                  ? 'bg-rose-50 border-rose-200 text-rose-900'
                  : w.severity === 'warning'
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
              }`}
            >
              {w.severity === 'critical' ? (
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              ) : w.severity === 'warning' ? (
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <div className="font-semibold flex items-center space-x-1.5">
                  <span className="font-mono text-[10px] px-1 rounded bg-black/5">
                    {w.code}
                  </span>
                  <span>{w.severity.toUpperCase()}</span>
                </div>
                <p className="mt-0.5 text-[11px] leading-snug">{w.message}</p>
              </div>
            </div>
          ))}

          {/* Anomaly section if any detected */}
          {dataQuality.anomalies.map((anom, aIdx) => (
            <div
              key={aIdx}
              className="p-2.5 rounded-md border border-amber-300 bg-amber-50 text-amber-900 text-xs flex items-start space-x-2"
            >
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Sensor Anomaly Flag:</span>
                <p className="text-[11px] mt-0.5">{anom}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 text-[11px] text-slate-500 italic">
        * Note: Data completeness screening compares verified hourly records against expected intervals based on EPA guidelines. It does not constitute a formal EPA or IDEM regulatory compliance or non-attainment determination.
      </div>
    </div>
  );
};
