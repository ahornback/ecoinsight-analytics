import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Maximize2,
  Info,
  Calendar,
  Layers,
  BarChart3,
  LineChart as LineChartIcon
} from 'lucide-react';
import { PM25Observation } from '../types/index.ts';

interface HistoricalChartProps {
  data: PM25Observation[];
  stationName: string;
  preset: string;
}

export const HistoricalChart: React.FC<HistoricalChartProps> = ({
  data,
  stationName,
  preset
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [chartMode, setChartMode] = useState<'line' | 'bar'>('line');
  const [showBenchmarks, setShowBenchmarks] = useState(true);

  // SVG Dimensions & Margins
  const width = 860;
  const height = 320;
  const padding = { top: 25, right: 30, bottom: 45, left: 55 };
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  // Compute Scales
  const { maxVal, minVal, points, dailyAverages } = useMemo(() => {
    if (!data || data.length === 0) {
      return { maxVal: 50, minVal: 0, points: [], dailyAverages: [] };
    }

    const maxObs = Math.max(...data.map(d => d.pm25));
    // Ensure we see at least up to 40 so the 35 µg/m³ line is visible
    const calculatedMax = Math.max(42, Math.ceil((maxObs + 8) / 10) * 10);
    const calculatedMin = 0;

    const computedPoints = data.map((d, i) => {
      const x = padding.left + (i / Math.max(1, data.length - 1)) * innerWidth;
      const y = padding.top + innerHeight - ((d.pm25 - calculatedMin) / (calculatedMax - calculatedMin)) * innerHeight;
      return { x, y, data: d, index: i };
    });

    // Daily averages aggregation
    const daysMap = new Map<string, { sum: number; count: number; max: number; label: string }>();
    data.forEach(d => {
      const dayKey = d.timestamp.substring(0, 10);
      const existing = daysMap.get(dayKey) || { sum: 0, count: 0, max: 0, label: d.formattedTime.split(',')[0] };
      existing.sum += d.pm25;
      existing.count += 1;
      existing.max = Math.max(existing.max, d.pm25);
      daysMap.set(dayKey, existing);
    });

    const computedDaily = Array.from(daysMap.entries()).map(([date, item], idx, arr) => {
      const avg = Math.round((item.sum / item.count) * 10) / 10;
      const barWidth = Math.max(16, innerWidth / (arr.length * 1.5));
      const x = padding.left + (idx + 0.5) * (innerWidth / arr.length);
      const y = padding.top + innerHeight - ((avg - calculatedMin) / (calculatedMax - calculatedMin)) * innerHeight;
      const h = innerHeight - (y - padding.top);
      return {
        date,
        label: item.label,
        avg,
        max: item.max,
        count: item.count,
        x,
        y,
        h,
        barWidth
      };
    });

    return {
      maxVal: calculatedMax,
      minVal: calculatedMin,
      points: computedPoints,
      dailyAverages: computedDaily
    };
  }, [data, innerWidth, innerHeight]);

  // Construct SVG Path
  const linePath = useMemo(() => {
    if (points.length < 2) return '';
    return points.reduce((acc, curr, idx) => {
      return idx === 0 ? `M ${curr.x} ${curr.y}` : `${acc} L ${curr.x} ${curr.y}`;
    }, '');
  }, [points]);

  // Area under the curve
  const areaPath = useMemo(() => {
    if (points.length < 2) return '';
    const first = points[0];
    const last = points[points.length - 1];
    const baselineY = padding.top + innerHeight;
    return `${linePath} L ${last.x} ${baselineY} L ${first.x} ${baselineY} Z`;
  }, [linePath, points, innerHeight]);

  // Y-axis value to Pixel converter
  const getYPixel = (val: number) => {
    return padding.top + innerHeight - ((val - minVal) / (maxVal - minVal)) * innerHeight;
  };

  const y35 = getYPixel(35.0); // 24-hr NAAQS standard
  const y9 = getYPixel(9.0);   // Annual NAAQS standard

  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null;

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-sm mb-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <div className="flex items-center space-x-2">
            <h3 className="font-bold text-slate-900 text-base">
              Historical PM2.5 Concentrations
            </h3>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-medium border border-emerald-200">
              Continuous Ground Ingestion
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Hourly continuous measurements at {stationName} ({data.length} observations)
          </p>
        </div>

        {/* View Toggles */}
        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
            <button
              onClick={() => setChartMode('line')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 font-medium transition-colors ${
                chartMode === 'line'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Hourly Trend</span>
            </button>
            <button
              onClick={() => setChartMode('bar')}
              className={`px-2.5 py-1 rounded flex items-center space-x-1 font-medium transition-colors ${
                chartMode === 'bar'
                  ? 'bg-white text-emerald-700 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Daily Averages</span>
            </button>
          </div>

          <button
            onClick={() => setShowBenchmarks(!showBenchmarks)}
            className={`text-xs px-2.5 py-1 rounded-md border transition-colors ${
              showBenchmarks
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-white text-slate-600 border-slate-300'
            }`}
            title="Toggle EPA NAAQS regulatory reference lines (35 µg/m³ 24h & 9 µg/m³ Annual)"
          >
            NAAQS Benchmarks: {showBenchmarks ? 'On' : 'Off'}
          </button>
        </div>
      </div>

      {/* SVG Container */}
      <div className="relative w-full overflow-x-auto">
        <svg
          role="img"
          tabIndex={0}
          aria-label={`${stationName} ${preset} PM2.5 chart with ${data.length} observations.`}
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[650px] select-none focus:outline-none focus:ring-2 focus:ring-emerald-500"
          onMouseLeave={() => setHoveredIndex(null)}
        >
          <defs>
            <linearGradient id="historicalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.32" />
              <stop offset="90%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>

            {/* EPA Category Shading Backgrounds */}
            <linearGradient id="goodZone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.05" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Background Grid Lines & Ticks */}
          {[0, 10, 20, 30, 40, 50].map((val) => {
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
                  strokeDasharray="3 3"
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

          {/* Y-Axis Label */}
          <text
            x={-height / 2}
            y={16}
            transform="rotate(-90)"
            textAnchor="middle"
            className="text-[10px] fill-slate-400 font-medium tracking-wider"
          >
            PM2.5 CONCENTRATION (µg/m³)
          </text>

          {/* EPA Regulatory Benchmark Lines */}
          {showBenchmarks && (
            <>
              {/* 35 µg/m³ 24-hr NAAQS */}
              {y35 >= padding.top && (
                <g>
                  <line
                    x1={padding.left}
                    y1={y35}
                    x2={width - padding.right}
                    y2={y35}
                    stroke="#ef4444"
                    strokeWidth="1.2"
                    strokeDasharray="5 3"
                  />
                  <rect
                    x={width - padding.right - 142}
                    y={y35 - 16}
                    width={140}
                    height={14}
                    rx={3}
                    fill="#fef2f2"
                    stroke="#fca5a5"
                    strokeWidth="0.8"
                  />
                  <text
                    x={width - padding.right - 72}
                    y={y35 - 6}
                    textAnchor="middle"
                    className="text-[9px] fill-rose-700 font-bold"
                  >
                    EPA 24-hr Ref Line (35 µg/m³)
                  </text>
                </g>
              )}

              {/* 9 µg/m³ Annual NAAQS */}
              {y9 >= padding.top && (
                <g>
                  <line
                    x1={padding.left}
                    y1={y9}
                    x2={width - padding.right}
                    y2={y9}
                    stroke="#f59e0b"
                    strokeWidth="1.2"
                    strokeDasharray="4 3"
                  />
                  <rect
                    x={width - padding.right - 142}
                    y={y9 + 3}
                    width={140}
                    height={14}
                    rx={3}
                    fill="#fffbeb"
                    stroke="#fcd34d"
                    strokeWidth="0.8"
                  />
                  <text
                    x={width - padding.right - 72}
                    y={y9 + 13}
                    textAnchor="middle"
                    className="text-[9px] fill-amber-800 font-bold"
                  >
                    EPA Annual Ref Line (9.0 µg/m³)
                  </text>
                </g>
              )}
            </>
          )}

          {/* Chart Mode: LINE */}
          {chartMode === 'line' && (
            <>
              {/* Area */}
              <path d={areaPath} fill="url(#historicalGradient)" />

              {/* Line */}
              <path
                d={linePath}
                fill="none"
                stroke="#059669"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Hover trigger areas & small point nodes */}
              {points.map((pt, i) => {
                const isHovered = hoveredIndex === i;
                const isDense = points.length > 50;
                return (
                  <g key={i}>
                    {/* Render circle nodes if sparse or hovered */}
                    {(!isDense || isHovered || pt.data.pm25 > 35) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5.5 : pt.data.pm25 > 35 ? 4 : 2.5}
                        fill={
                          pt.data.pm25 > 35
                            ? '#ef4444'
                            : pt.data.pm25 > 12
                            ? '#f59e0b'
                            : '#059669'
                        }
                        stroke="#ffffff"
                        strokeWidth={isHovered ? 2.5 : 1.2}
                        className="transition-all duration-150"
                      />
                    )}

                    {/* Wide hit-box for smooth hovering */}
                    <rect
                      x={pt.x - innerWidth / points.length / 2}
                      y={padding.top}
                      width={innerWidth / points.length}
                      height={innerHeight}
                      fill="transparent"
                      onMouseEnter={() => setHoveredIndex(i)}
                      className="cursor-crosshair"
                    />
                  </g>
                );
              })}

              {/* Hover Crosshair Guide */}
              {hoveredPoint && (
                <g>
                  <line
                    x1={hoveredPoint.x}
                    y1={padding.top}
                    x2={hoveredPoint.x}
                    y2={padding.top + innerHeight}
                    stroke="#059669"
                    strokeWidth="1"
                    strokeDasharray="2 2"
                  />
                  <circle
                    cx={hoveredPoint.x}
                    cy={hoveredPoint.y}
                    r={6.5}
                    fill="#059669"
                    stroke="#ffffff"
                    strokeWidth="3"
                  />
                </g>
              )}
            </>
          )}

          {/* Chart Mode: BAR (Daily Averages) */}
          {chartMode === 'bar' && (
            <g>
              {dailyAverages.map((bar, bIdx) => {
                const isExceed = bar.avg > 35.0;
                const isModerate = bar.avg > 9.0;
                return (
                  <g key={bIdx}>
                    <rect
                      x={bar.x - bar.barWidth / 2}
                      y={bar.y}
                      width={bar.barWidth}
                      height={Math.max(2, bar.h)}
                      rx={3}
                      fill={isExceed ? '#ef4444' : isModerate ? '#f59e0b' : '#10b981'}
                      opacity={0.88}
                      className="transition-all hover:opacity-100"
                    />
                    {/* Top value label */}
                    <text
                      x={bar.x}
                      y={bar.y - 4}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-600 font-mono font-semibold"
                    >
                      {bar.avg}
                    </text>
                    {/* Date label at bottom */}
                    <text
                      x={bar.x}
                      y={padding.top + innerHeight + 14}
                      textAnchor="middle"
                      className="text-[9px] fill-slate-500 font-medium"
                    >
                      {bar.label}
                    </text>
                  </g>
                );
              })}
            </g>
          )}

          {/* X-Axis baseline */}
          <line
            x1={padding.left}
            y1={padding.top + innerHeight}
            x2={width - padding.right}
            y2={padding.top + innerHeight}
            stroke="#cbd5e1"
            strokeWidth="1.2"
          />

          {/* X-Axis Ticks (For Line Mode) */}
          {chartMode === 'line' &&
            points.length > 0 &&
            [0, Math.floor(points.length / 4), Math.floor(points.length / 2), Math.floor((3 * points.length) / 4), points.length - 1].map((pIdx) => {
              const pt = points[pIdx];
              if (!pt) return null;
              return (
                <g key={pIdx}>
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
                    {pt.data.formattedTime}
                  </text>
                </g>
              );
            })}
        </svg>

        {/* Hover Tooltip Popup */}
        {hoveredPoint && chartMode === 'line' && (
          <div
            className="absolute z-20 pointer-events-none bg-slate-900/95 text-white p-2.5 rounded-lg shadow-xl border border-slate-700/80 text-xs backdrop-blur-sm transition-all"
            style={{
              left: `${Math.min(width - 180, Math.max(padding.left, hoveredPoint.x - 70))}px`,
              top: `${Math.max(10, hoveredPoint.y - 85)}px`,
              transform: 'translateY(-10px)'
            }}
          >
            <div className="font-semibold text-slate-200 border-b border-slate-700 pb-1 mb-1.5 flex items-center justify-between space-x-2">
              <span>{hoveredPoint.data.formattedTime}</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-900 text-emerald-300 font-mono">
                {hoveredPoint.data.qualityFlag}
              </span>
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="text-lg font-bold text-emerald-400">
                {hoveredPoint.data.pm25.toFixed(1)}
              </span>
              <span className="text-slate-600 text-[10px]">µg/m³ PM2.5</span>
            </div>
            <div className="mt-1 flex items-center justify-between text-[11px] text-slate-300">
              <span>AQI: {hoveredPoint.data.aqi}</span>
              <span className="font-medium text-emerald-300">
                {hoveredPoint.data.aqiCategory}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Legend & Standards Footnote */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] text-slate-500 gap-2">
        <div className="flex items-center space-x-4">
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-emerald-600 rounded" />
            <span>Observed Hourly Continuous Reading</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-rose-500 border-t border-dashed" />
            <span>EPA 24-hr Ref Line (35 µg/m³)</span>
          </span>
          <span className="flex items-center space-x-1.5">
            <span className="w-3 h-0.5 bg-amber-500 border-t border-dashed" />
            <span>EPA Annual Ref Line (9.0 µg/m³)</span>
          </span>
        </div>

        <span className="text-slate-600">
          Source: Open-Meteo Air Quality (IDEM / CAMS Airshed Reanalysis)
        </span>
      </div>
    </div>
  );
};
