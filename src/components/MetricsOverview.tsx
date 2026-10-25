import React from 'react';
import {
  Activity,
  Gauge,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  ShieldAlert,
  XCircle,
  FileCheck
} from 'lucide-react';
import {
  PM25Observation,
  ForecastAvailability,
  DataQualityReport,
  SummaryStatistics
} from '../types/index.ts';

interface MetricsOverviewProps {
  latestObservation: PM25Observation | null;
  forecastAvailability: ForecastAvailability;
  dataQuality: DataQualityReport;
  statistics: SummaryStatistics;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({
  latestObservation,
  forecastAvailability,
  dataQuality,
  statistics
}) => {
  const getAQIBadgeStyle = (category?: string) => {
    switch (category) {
      case 'Good':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Moderate':
        return 'bg-amber-100 text-amber-900 border-amber-300';
      case 'Unhealthy for Sensitive Groups':
        return 'bg-orange-100 text-orange-900 border-orange-300';
      case 'Unhealthy':
        return 'bg-rose-100 text-rose-900 border-rose-300';
      case 'Very Unhealthy':
        return 'bg-purple-100 text-purple-900 border-purple-300';
      case 'Hazardous':
        return 'bg-red-900 text-red-100 border-red-700';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Latest PM2.5 Observation Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-600" />
              <span>Latest Observation</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              Ground Sensor
            </span>
          </div>

          {latestObservation ? (
            <div className="mt-1">
              <div className="flex items-baseline space-x-2">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                  {latestObservation.pm25.toFixed(1)}
                </span>
                <span className="text-sm font-semibold text-slate-500">µg/m³</span>
              </div>

              <div className="mt-2.5 flex items-center space-x-2">
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getAQIBadgeStyle(
                    latestObservation.aqiCategory
                  )}`}
                >
                  AQI {latestObservation.aqi} • {latestObservation.aqiCategory}
                </span>
              </div>
            </div>
          ) : (
            <div className="py-4 text-center text-xs text-slate-600">
              No recent observation available
            </div>
          )}
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-slate-400" />
            <span>Observed: {latestObservation?.formattedTime || 'N/A'}</span>
          </span>
          <span className="text-emerald-700 font-medium font-mono text-[10px]">
            Flag: {latestObservation?.qualityFlag || 'N/A'}
          </span>
        </div>
      </div>

      {/* 2. Forecast Availability Indicator */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Forecast Availability</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium">
              24-Hour Horizon
            </span>
          </div>

          <div className="mt-1">
            <div className="flex items-center space-x-2">
              {forecastAvailability.available ? (
                <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              ) : (
                <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                  <XCircle className="w-5 h-5" />
                </div>
              )}
              <div>
                <span
                  className={`text-sm font-bold block ${
                    forecastAvailability.available
                      ? 'text-emerald-700'
                      : 'text-amber-800'
                  }`}
                >
                  {forecastAvailability.available
                    ? `Active (${forecastAvailability.totalForecastHoursAvailable}h Available)`
                    : 'Model Forecast Suppressed'}
                </span>
                <span className="text-[11px] text-slate-500 block truncate">
                  {forecastAvailability.available
                    ? 'CAMS Global Dispersion Model'
                    : 'Gating threshold not met'}
                </span>
              </div>
            </div>

            <p className="mt-2 text-xs text-slate-600 leading-snug line-clamp-2">
              {forecastAvailability.reason}
            </p>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Source: ECMWF CAMS</span>
          <span className="font-mono text-[10px] text-slate-600">
            Latency: {forecastAvailability.observationsLatencyHours}h
          </span>
        </div>
      </div>

      {/* 3. Data Completeness & Latency Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              <span>Data Completeness</span>
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full font-medium border ${
                dataQuality.meetsCompletenessBenchmark
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {dataQuality.meetsCompletenessBenchmark ? '≥ 75% Benchmark Met' : '< 75% Benchmark'}
            </span>
          </div>

          <div className="mt-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {dataQuality.completenessPercent.toFixed(1)}%
              </span>
              <span className="text-xs text-slate-500">
                ({dataQuality.validHourlyObservations}/{dataQuality.expectedHourlySlots} valid hrs)
              </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  dataQuality.completenessPercent >= 90
                    ? 'bg-emerald-500'
                    : dataQuality.completenessPercent >= 75
                    ? 'bg-blue-500'
                    : 'bg-amber-500'
                }`}
                style={{ width: `${Math.min(100, dataQuality.completenessPercent)}%` }}
              />
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Missing: {dataQuality.missingHourlySlots} hrs</span>
          <span
            className={`font-medium ${
              dataQuality.staleLevel === 'nominal'
                ? 'text-emerald-600'
                : dataQuality.staleLevel === 'warning'
                ? 'text-amber-600'
                : 'text-rose-600 font-bold'
            }`}
          >
            {dataQuality.staleLevel === 'nominal'
              ? 'Stream Fresh (< 2.5h)'
              : `Latency: ${dataQuality.hoursSinceLatestObservation}h (${dataQuality.staleLevel})`}
          </span>
        </div>
      </div>

      {/* 4. Period Peak & EPA Reference Comparison Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-sm flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center space-x-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
              <span>Period Peak & Ref Thresholds</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 font-mono">
              NAAQS Ref Line
            </span>
          </div>

          <div className="mt-1">
            <div className="flex items-baseline space-x-2">
              <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                {statistics.max.toFixed(1)}
              </span>
              <span className="text-sm font-semibold text-slate-500">µg/m³</span>
            </div>

            <div className="mt-2 text-xs flex items-center space-x-1.5">
              {statistics.exceedanceCount24hStandard > 0 ? (
                <span className="text-rose-700 font-semibold flex items-center space-x-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                  <span>{statistics.exceedanceCount24hStandard} hrs above 35 µg/m³ ref line</span>
                </span>
              ) : (
                <span className="text-emerald-700 font-semibold flex items-center space-x-1">
                  <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>0 hrs above 35 µg/m³ ref line</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Mean: {statistics.mean.toFixed(1)} µg/m³</span>
          <span className="font-medium text-slate-700">
            98th %tile: {statistics.percentile98.toFixed(1)} µg/m³
          </span>
        </div>
      </div>
    </div>
  );
};
