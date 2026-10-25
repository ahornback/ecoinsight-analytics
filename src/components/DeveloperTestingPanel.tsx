import React, { useRef } from 'react';
import { useDialogBehavior } from './useDialogBehavior.ts';
import {
  FlaskConical,
  X,
  ServerCrash,
  WifiOff,
  Clock,
  Layers,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ShieldAlert,
  Play,
  Info
} from 'lucide-react';
import { SimulationCondition } from '../types/index.ts';

interface DeveloperTestingPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentCondition: SimulationCondition;
  onSelectCondition: (condition: SimulationCondition) => void;
  isLoading: boolean;
  selectedStationName: string;
}

export const isDevEnvironment = (): boolean => import.meta.env.DEV;

export const DeveloperTestingPanel: React.FC<DeveloperTestingPanelProps> = ({
  isOpen,
  onClose,
  currentCondition,
  onSelectCondition,
  isLoading,
  selectedStationName
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(isOpen, onClose, dialogRef);
  if (!isOpen) return null;

  const scenarios: Array<{
    id: SimulationCondition;
    title: string;
    badge: string;
    icon: React.ElementType;
    iconColor: string;
    description: string;
    expectedOutcome: string;
    rulesVerified: string;
  }> = [
    {
      id: 'none',
      title: 'Normal Operational Mode (Live Feed)',
      badge: 'PROD REAL DATA',
      icon: CheckCircle2,
      iconColor: 'text-emerald-500',
      description: 'Fetches unmodified, authenticated PM2.5 measurements directly from Open-Meteo & Copernicus CAMS APIs for the active Indiana monitor.',
      expectedOutcome: 'Normal dashboard state with full 24-hr CAMS forecast model displayed if recent readings are valid.',
      rulesVerified: 'Real data provenance, genuine API response verification, no test overlays.'
    },
    {
      id: 'api_failure',
      title: '1. External Environmental API Failure',
      badge: 'TEST SIMULATION',
      icon: ServerCrash,
      iconColor: 'text-rose-500',
      description: 'Simulates an upstream gateway timeout / network disconnection (HTTP 503) from Open-Meteo air quality servers.',
      expectedOutcome: 'Application immediately shows an explicit error notification and a Retry button. Strictly ZERO fabricated or synthetic values are shown.',
      rulesVerified: 'Graceful failure recovery; no synthetic data substitution on upstream outage.'
    },
    {
      id: 'missing_observations',
      title: '2. Missing PM2.5 Observations',
      badge: 'TEST SIMULATION',
      icon: WifiOff,
      iconColor: 'text-amber-500',
      description: 'Simulates intermittent sensor telemetry dropouts and zero/span calibrations by masking ~28% of historical hourly slots as missing.',
      expectedOutcome: 'Data Quality panel flags missing intervals (e.g., 48 missing hours); completeness updates accurately without inventing data.',
      rulesVerified: 'Telemetry gap tracking; accurate valid vs expected hourly slots calculation.'
    },
    {
      id: 'stale_data',
      title: '3. Stale Environmental Data (> 6.0h Latency)',
      badge: 'TEST SIMULATION',
      icon: Clock,
      iconColor: 'text-amber-500',
      description: 'Simulates a 7.5-hour sensor transmission blackout (exceeding the 4.0-hour maximum reliability threshold).',
      expectedOutcome: 'ForecastSection automatically suppresses 24-hour forecast and displays scientific explanation: "Observation stream latency (7.5h) exceeds the 4.0-hour maximum threshold".',
      rulesVerified: 'Forecast gating safeguard; unanchored forecast suppression.'
    },
    {
      id: 'incomplete_history',
      title: '4. Incomplete Historical Observations (< 70%)',
      badge: 'TEST SIMULATION',
      icon: Layers,
      iconColor: 'text-rose-500',
      description: 'Simulates severe observation record loss, causing historical completeness to drop to ~45% (below both the 75% EPA benchmark and 70% forecast gate).',
      expectedOutcome: 'Forecast is suppressed with warning that completeness is below 70%; Data Quality panel flags failure to meet EPA reference benchmarks.',
      rulesVerified: 'Strict informational completeness gating and forecast suppression.'
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="testing-dialog-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-950 p-5 text-white flex items-center justify-between border-b border-amber-900/60 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-amber-600/90 flex items-center justify-center shadow-inner text-white ring-1 ring-amber-400/50">
              <FlaskConical className="w-5 h-5 text-amber-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 id="testing-dialog-title" className="font-bold text-base tracking-tight text-white">
                  Developer Controlled Testing Panel
                </h3>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-700 font-mono">
                  Test Mode Only
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Stress-test upstream failure recovery, forecast suppression gates, and data-quality warnings
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Integrity Guarantee Callout */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-start space-x-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              <strong className="block text-emerald-950 font-bold mb-0.5">
                Scientific Integrity & Report Non-Contamination Guarantee:
              </strong>
              Simulated conditions run entirely in a temporary, isolated simulation layer. Real environmental observations in the database and cache are never modified. Exported PDF reports are prominently watermarked as QA Test Simulations to prevent contamination of official records.
            </div>
          </div>

          {/* Active Station Notice */}
          <div className="flex items-center justify-between p-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600">
            <span>
              Target Monitoring Station: <strong className="text-slate-900">{selectedStationName}</strong>
            </span>
            <div className="flex items-center space-x-2">
              <span className="text-slate-500">Current Status:</span>
              <span className={`px-2 py-0.5 rounded font-bold text-[11px] ${
                currentCondition === 'none'
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-amber-100 text-amber-800 border border-amber-300'
              }`}>
                {currentCondition === 'none' ? 'LIVE FEED (NORMAL)' : `TEST: ${currentCondition.toUpperCase()}`}
              </span>
            </div>
          </div>

          {/* Scenario Selection Grid */}
          <div className="space-y-3">
            <span className="font-bold text-slate-800 block text-xs uppercase tracking-wider">
              Select Controlled Test Scenario:
            </span>

            {scenarios.map((sc) => {
              const Icon = sc.icon;
              const isSelected = currentCondition === sc.id;

              return (
                <div
                  key={sc.id}
                  onClick={() => onSelectCondition(sc.id)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-50/70 border-amber-500 ring-2 ring-amber-400/40 shadow-sm'
                      : 'bg-white hover:bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center space-x-2.5">
                      <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-amber-200/70' : 'bg-slate-100'}`}>
                        <Icon className={`w-4 h-4 ${sc.iconColor}`} />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">
                          {sc.title}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5">
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                        sc.id === 'none'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}>
                        {sc.badge}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white font-bold animate-pulse">
                          ACTIVE
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600 text-xs mt-1 mb-2">
                    {sc.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] pt-2 border-t border-slate-100">
                    <div>
                      <strong className="text-slate-700 block">Expected Application Behavior:</strong>
                      <span className="text-slate-500">{sc.expectedOutcome}</span>
                    </div>
                    <div>
                      <strong className="text-slate-700 block">Verification Rule:</strong>
                      <span className="text-slate-500">{sc.rulesVerified}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer Controls */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <button
            onClick={() => onSelectCondition('none')}
            disabled={currentCondition === 'none' || isLoading}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 cursor-pointer ${
              currentCondition === 'none'
                ? 'opacity-50 text-slate-400 border-slate-200'
                : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Live Operational Data</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer shadow-sm"
          >
            Close Testing Panel
          </button>
        </div>
      </div>
    </div>
  );
};
