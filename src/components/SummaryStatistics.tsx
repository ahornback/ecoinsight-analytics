import React from 'react';
import {
  BarChart,
  Calculator,
  Sigma,
  ArrowUpRight,
  ArrowDownRight,
  Shield,
  Layers,
  Award
} from 'lucide-react';
import { SummaryStatistics as StatsType } from '../types/index.ts';

interface SummaryStatisticsProps {
  statistics: StatsType;
  stationName: string;
  preset: string;
}

export const SummaryStatistics: React.FC<SummaryStatisticsProps> = ({
  statistics,
  stationName,
  preset
}) => {
  const statItems = [
    {
      label: 'Sample Count (Hours)',
      value: `${statistics.count} hrs`,
      desc: `Hourly valid data points in ${preset.toUpperCase()} window`,
      icon: Layers,
      highlight: false
    },
    {
      label: 'Arithmetic Mean',
      value: `${statistics.mean} µg/m³`,
      desc: 'Central tendency concentration',
      icon: Calculator,
      highlight: false
    },
    {
      label: 'Median (50th %tile)',
      value: `${statistics.median} µg/m³`,
      desc: 'Skew-resistant midpoint value',
      icon: BarChart,
      highlight: false
    },
    {
      label: 'Standard Deviation (σ)',
      value: `±${statistics.stdDev} µg/m³`,
      desc: 'Dispersion & atmospheric variability',
      icon: Sigma,
      highlight: false
    },
    {
      label: 'Period Maximum (Peak)',
      value: `${statistics.max} µg/m³`,
      desc: 'Highest recorded hourly level',
      icon: ArrowUpRight,
      highlight: statistics.max > 35
    },
    {
      label: 'Period Minimum',
      value: `${statistics.min} µg/m³`,
      desc: 'Clean air background trough',
      icon: ArrowDownRight,
      highlight: false
    },
    {
      label: '98th Percentile',
      value: `${statistics.percentile98} µg/m³`,
      desc: 'EPA NAAQS 24-hr design benchmark metric',
      icon: Award,
      highlight: statistics.percentile98 > 35
    },
    {
      label: 'Hours > 35 µg/m³ (24h Ref)',
      value: `${statistics.exceedanceCount24hStandard} hrs`,
      desc: 'Hours exceeding 35.0 µg/m³ reference line',
      icon: Shield,
      highlight: statistics.exceedanceCount24hStandard > 0
    }
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-4 sm:p-5 shadow-sm mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h3 className="font-bold text-slate-900 text-base">
            Statistical Analysis & NAAQS Metric Summary
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Parametric and non-parametric distribution statistics for {stationName}
          </p>
        </div>

        <div className="text-xs text-slate-600 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
          Dominant Air Mass: <strong className="text-emerald-700">{statistics.dominantCategory}</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {statItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border transition-all ${
                item.highlight
                  ? 'bg-rose-50/70 border-rose-200 text-rose-950'
                  : 'bg-slate-50/60 border-slate-200/90 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between mb-1 text-slate-500">
                <span className="text-[11px] font-semibold uppercase tracking-wider">
                  {item.label}
                </span>
                <Icon className={`w-3.5 h-3.5 ${item.highlight ? 'text-rose-500' : 'text-slate-400'}`} />
              </div>
              <div className="text-xl font-bold tracking-tight">
                {item.value}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5 leading-tight">
                {item.desc}
              </div>
            </div>
          );
        })}
      </div>

      {/* Regulatory Context Footer */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center space-x-1.5">
          <Shield className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>
            Annual NAAQS benchmark: 9.0 µg/m³ (Revised 2024) | 24-Hour reference threshold: 35.0 µg/m³. Informational calculation only; formal attainment requires 3 consecutive certified monitoring years.
          </span>
        </div>
        <span className="text-slate-600 text-[11px]">
          EPA 40 CFR Appendix N to Part 50
        </span>
      </div>
    </div>
  );
};
