import React, { useState } from 'react';
import {
  Sparkles,
  ShieldAlert,
  Clock,
  TrendingUp,
  AlertTriangle,
  Info,
  RefreshCw,
  Table
} from 'lucide-react';
import { PM25ForecastPoint, ForecastAvailability } from '../types/index.ts';

interface ForecastSectionProps {
  forecast: PM25ForecastPoint[];
  availability: ForecastAvailability;
  onRefreshData?: () => void;
  isSimulatingStale: boolean;
  onToggleSimulateStale: () => void;
}

export const ForecastSection: React.FC<ForecastSectionProps> = ({
  forecast,
  availability,
  onRefreshData,
  isSimulatingStale,
  onToggleSimulateStale
}) => {
  const [selectedPointIndex, setSelectedPointIndex] = useState<number | null>(null);
  const [showFullTable, setShowFullTable] = useState(false);

  // Peak predicted value
  const peakForecast = forecast.length > 0
    ? [...forecast].sort((a, b) => b.pm25Predicted - a.pm25Predicted)[0]
    : null;

  const meanPredicted = forecast.length > 0
    ? Math.round((forecast.reduce((acc, f) => acc + f.pm25Predicted, 0) / forecast.length) * 10) / 10
    : 0;

  // Chart Dimensions
  const width = 860;
  const height = 240;
  const padding = { top: 25, right: 30, bottom: 40, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const maxVal = Math.max(
    38,
    forecast.length > 0
      ? Math.ceil((Math.max(...forecast.map(f => f.pm25Predicted)) + 6) / 5) * 5
      : 38
  );
  const minVal = 0;

  const getYPixel = (val: number) => {
    return padding.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  const chartPoints = forecast.map((f, i) => {
    const x = padding.left + (i / Math.max(1, forecast.length - 1)) * innerWidth;
    const y = getYPixel(f.pm25Predicted);
    return { x, y, data: f, index: i };
  });

  // Predicted Line Path
  const linePath = chartPoints.reduce((acc, curr, idx) => {
    return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
  }, '');

  // Area under the trajectory curve
  const areaPath = chartPoints.length > 1 ? (() => {
    const first = chartPoints[0];
    const last = chartPoints[chartPoints.length - 1];
    const baselineY = padding.top + innerHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  })() : '';

  const y35 = getYPixel(35.0);

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-sm mb-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-md bg-indigo-100 text-indigo-700 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <h3 className="font-bold text-slate-900 text-base">
              24-Hour PM2.5 Forecast Evaluation
            </h3>
            <span
              className={`text-[11px] px-2 py-0.5 rounded font-semibold border ${
                availability.available
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}
            >
              {availability.available
                ? `CAMS Run Active (${forecast.length} of ${availability.targetHorizonHours}h)`
                : 'Forecast Withheld'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Numerical atmospheric dispersion simulation from Copernicus Atmosphere Monitoring Service (ECMWF CAMS)
          </p>
        </div>

        {/* Forecast Horizon & Table Toggle */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setShowFullTable(!showFullTable)}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
          >
            <Table className="w-3.5 h-3.5" />
            <span>{showFullTable ? 'Hide 24h Table' : 'View Full 24h Table'}</span>
          </button>
        </div>
      </div>

      {/* Actual Prediction Method Transparency Notice */}
      <div className="mb-4 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
        <span className="font-semibold text-slate-800 block mb-0.5">
          Prediction Source & Method:
        </span>
        <p className="text-[11px] leading-relaxed">
          {availability.predictionMethodDescription}
        </p>
      </div>

      {/* If Forecast is AVAILABLE: Render Forecast Interface */}
      {availability.available && forecast.length > 0 ? (
        <div>
          {/* Key Forecast Summary Highlights */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
            <div className="bg-indigo-50/60 border border-indigo-100 rounded-lg p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-900 block mb-0.5">
                Expected 24-Hr Mean
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-indigo-950">
                  {meanPredicted}
                </span>
                <span className="text-xs text-indigo-700 font-medium">µg/m³</span>
              </div>
              <span className="text-[11px] text-indigo-600 block mt-1">
                Projected general air mass trend
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 block mb-0.5">
                Projected Peak Concentration
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span className="text-2xl font-bold text-slate-900">
                  {peakForecast?.pm25Predicted.toFixed(1) || 'N/A'}
                </span>
                <span className="text-xs text-slate-500">µg/m³</span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1 truncate">
                Expected: {peakForecast?.formattedTime || 'N/A'}
              </span>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-700 block mb-0.5">
                24-Hr Standard (35 µg/m³) Ref Check
              </span>
              <div className="flex items-baseline space-x-1.5">
                <span
                  className={`text-base font-bold ${
                    (peakForecast?.pm25Predicted || 0) > 35
                      ? 'text-rose-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {(peakForecast?.pm25Predicted || 0) > 35
                    ? 'Projected Peak Exceeds 35 µg/m³'
                    : 'All 24 Hours Below 35 µg/m³'}
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block mt-1">
                Informational 24-hr NAAQS reference comparison
              </span>
            </div>
          </div>

          {/* Forecast Visual Chart */}
          <div className="relative w-full overflow-x-auto bg-slate-50/50 rounded-lg border border-slate-200/80 p-2">
            <div className="flex items-center justify-between text-xs px-2 pt-1 pb-2">
              <div className="flex items-center space-x-2">
                <span className="inline-block w-4 h-0.5 border-t-2 border-dashed border-indigo-600" />
                <span className="font-semibold text-indigo-900">
                  Predicted PM2.5 Trajectory
                </span>
                <span className="text-slate-600 text-[11px]">(Deterministic CAMS Model Points)</span>
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Model: ECMWF CAMS
              </span>
            </div>

            <svg
              role="img"
              tabIndex={0}
              aria-label={
                availability.available
                  ? `24-hour PM2.5 forecast chart, ${forecast.length} hours, mean ${meanPredicted} micrograms per cubic meter. The full table lists every hour.`
                  : 'Forecast chart withheld because data quality gates were not met.'
              }
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-auto min-w-[650px] select-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {/* Grid Lines */}
              {[0, 10, 20, 30, 40].map((val) => {
                if (val > maxVal) return null;
                const yPix = getYPixel(val);
                return (
                  <g key={val}>
                    <line
                      x1={padding.left}
                      y1={yPix}
                      x2={width - padding.right}
                      y2={yPix}
                      stroke="#e2e8f0"
                      strokeWidth="0.8"
                      strokeDasharray="2 2"
                    />
                    <text
                      x={padding.left - 8}
                      y={yPix + 3.5}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* 35 µg/m³ Reference Line */}
              {y35 >= padding.top && (
                <g>
                  <line
                    x1={padding.left}
                    y1={y35}
                    x2={width - padding.right}
                    y2={y35}
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="4 4"
                  />
                  <text
                    x={width - padding.right - 10}
                    y={y35 - 5}
                    textAnchor="end"
                    className="text-[9px] fill-rose-600 font-bold"
                  >
                    EPA 24-hr Ref Line (35 µg/m³)
                  </text>
                </g>
              )}

              {/* Confidence Interval Band */}
              {/* Shaded Area under Trajectory */}
              {areaPath && (
                <path
                  d={areaPath}
                  fill="#e0e7ff"
                  fillOpacity="0.3"
                />
              )}

              {/* Central Forecast Line (Dashed) */}
              <path
                d={linePath}
                fill="none"
                stroke="#4f46e5"
                strokeWidth="2.5"
                strokeDasharray="6 4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Forecast Point Dots */}
              {chartPoints.map((pt, i) => {
                const isSelected = selectedPointIndex === i;
                return (
                  <g key={i}>
                    <circle
                      cx={pt.x}
                      cy={pt.y}
                      r={isSelected ? 6 : 3.5}
                      fill="#ffffff"
                      stroke="#4f46e5"
                      strokeWidth={isSelected ? 3 : 2}
                      className="cursor-pointer transition-all hover:scale-125"
                      onMouseEnter={() => setSelectedPointIndex(i)}
                    />
                    {/* Hit box */}
                    <rect
                      x={pt.x - innerWidth / chartPoints.length / 2}
                      y={padding.top}
                      width={innerWidth / chartPoints.length}
                      height={innerHeight}
                      fill="transparent"
                      className="cursor-pointer"
                      onMouseEnter={() => setSelectedPointIndex(i)}
                    />
                  </g>
                );
              })}

              {/* X-Axis line & labels */}
              <line
                x1={padding.left}
                y1={padding.top + innerHeight}
                x2={width - padding.right}
                y2={padding.top + innerHeight}
                stroke="#cbd5e1"
                strokeWidth="1.2"
              />

              {[0, 3, 6, 9, 12, 15, 18, 21, forecast.length - 1].map((idx) => {
                const pt = chartPoints[idx];
                if (!pt) return null;
                return (
                  <g key={idx}>
                    <line
                      x1={pt.x}
                      y1={padding.top + innerHeight}
                      x2={pt.x}
                      y2={padding.top + innerHeight + 4}
                      stroke="#94a3b8"
                      strokeWidth="1"
                    />
                    <text
                      x={pt.x}
                      y={padding.top + innerHeight + 16}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-500 font-medium"
                    >
                      {`T+${idx + 1}h`}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Selected Forecast Point Callout */}
            {selectedPointIndex !== null && chartPoints[selectedPointIndex] && (
              <div className="mt-2 p-2.5 bg-white border border-indigo-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-indigo-950">
                    Hour T+{chartPoints[selectedPointIndex].data.hourIndex} ({chartPoints[selectedPointIndex].data.formattedTime})
                  </span>
                  <span className="text-slate-500 ml-2">
                    Method: Copernicus CAMS Numerical Model Point Estimate
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-800">
                    {chartPoints[selectedPointIndex].data.pm25Predicted.toFixed(1)} µg/m³
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                    {chartPoints[selectedPointIndex].data.aqiCategory} (AQI {chartPoints[selectedPointIndex].data.aqiPredicted})
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Complete 24-Hour Forecast Hourly Table */}
          {showFullTable && (
            <div className="mt-4 border border-slate-200 rounded-lg overflow-hidden">
              <div className="p-2.5 bg-slate-100/90 border-b border-slate-200 text-xs font-semibold text-slate-800 flex items-center justify-between">
                <span>Complete 24-Hour Forecast Table (Hours T+1 to T+{forecast.length})</span>
                <span className="text-[11px] text-slate-500 font-normal">
                  Model: Copernicus CAMS Global (ECMWF)
                </span>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                    <tr>
                      <th className="py-2 px-3">Horizon</th>
                      <th className="py-2 px-3">Timestamp</th>
                      <th className="py-2 px-3">Predicted PM2.5</th>
                      <th className="py-2 px-3">Predicted AQI</th>
                      <th className="py-2 px-3">AQI Category</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {forecast.map((fc) => (
                      <tr key={fc.hourIndex} className="hover:bg-slate-50">
                        <td className="py-1.5 px-3 font-semibold text-indigo-900">
                          T+{fc.hourIndex}h
                        </td>
                        <td className="py-1.5 px-3 text-slate-600">
                          {fc.formattedTime}
                        </td>
                        <td className="py-1.5 px-3 font-bold text-slate-900">
                          {fc.pm25Predicted.toFixed(1)} µg/m³
                        </td>
                        <td className="py-1.5 px-3 text-slate-700 font-mono text-[11px]">
                          AQI {fc.aqiPredicted}
                        </td>
                        <td className="py-1.5 px-3">
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                            {fc.aqiCategory}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* If Forecast is SUPPRESSED / UNAVAILABLE */
        <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 text-amber-900">
          <div className="flex items-start space-x-3.5">
            <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 border border-amber-300">
              <ShieldAlert className="w-5 h-5 text-amber-700" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-base text-amber-950 flex items-center space-x-2">
                <span>24-Hour Forecast Suppressed — Data Reliability Safeguard Active</span>
              </h4>
              <p className="text-xs text-amber-800 mt-1 leading-relaxed">
                In accordance with environmental data assurance protocols, EcoInsight Analytics does not display forward predictions when recent baseline observations are delayed, incomplete, or missing.
              </p>

              <div className="mt-3.5 bg-white/80 rounded-lg p-3 border border-amber-200/80">
                <span className="text-xs font-semibold text-slate-900 block mb-2">
                  Diagnostic Gating Criteria Status:
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {availability.missingPrerequisites && availability.missingPrerequisites.length > 0 ? (
                    availability.missingPrerequisites.map((prereq, pIdx) => (
                      <li key={pIdx} className="flex items-start space-x-2 text-rose-700 font-medium">
                        <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                        <span>{prereq}</span>
                      </li>
                    ))
                  ) : (
                    <li className="flex items-start space-x-2 text-rose-700 font-medium">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-rose-600" />
                      <span>Station observations latency exceeds the 4.0-hour maximum threshold.</span>
                    </li>
                  )}
                  <li className="flex items-start space-x-2 text-slate-600">
                    <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-slate-400" />
                    <span>Atmospheric chemistry forecast models require fresh ground-level baseline measurements to calibrate initial boundary conditions. Suppressing unanchored predictions prevents inaccurate advisory reporting.</span>
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {isSimulatingStale && (
                  <button
                    onClick={onToggleSimulateStale}
                    className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors cursor-pointer"
                  >
                    Restore Normal Live Telemetry Stream
                  </button>
                )}
                {onRefreshData && (
                  <button
                    onClick={onRefreshData}
                    className="text-xs px-3 py-1.5 rounded-md bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Re-query Station Feed</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
