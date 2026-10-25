import React, { useState, useEffect, useRef } from 'react';
import { useDialogBehavior } from './useDialogBehavior.ts';
import {
  FileDown,
  X,
  CheckSquare,
  Square,
  FileText,
  Calendar,
  Building,
  CheckCircle2,
  Printer,
  RotateCcw,
  AlertTriangle
} from 'lucide-react';
import { StationDataResponse, User } from '../types/index.ts';
import { generateStationPdfReport } from '../services/pdfReportGenerator.ts';

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: StationDataResponse;
  user: User | null;
}

export function buildDefaultAnalystNotes(d: StationDataResponse): string {
  return `Station ${d.station.name} (${d.station.county}, ${d.station.city}): Continuous ${d.station.monitorType} measurements show an observation mean of ${d.statistics.mean} ug/m3 (min: ${d.statistics.min} ug/m3, max: ${d.statistics.max} ug/m3, std dev: ${d.statistics.stdDev} ug/m3) with ${d.statistics.exceedanceCount24hStandard} hours exceeding the 35 ug/m3 24-hr reference line. Data completeness (${d.dataQuality.completenessPercent}%) satisfies the 75% informational benchmark for regulatory screening. Notes: Ambient trends should be evaluated in context with localized meteorology and industrial/traffic dispersion patterns in ${d.station.city}.`;
}

export const ExportReportModal: React.FC<ExportReportModalProps> = ({
  isOpen,
  onClose,
  data,
  user
}) => {
  const [includeForecast, setIncludeForecast] = useState(true);
  const [customNotes, setCustomNotes] = useState<string>(() => buildDefaultAnalystNotes(data));
  const [generating, setGenerating] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(isOpen, onClose, dialogRef);

  // Synchronize notes whenever the station or underlying dataset changes
  useEffect(() => {
    setCustomNotes(buildDefaultAnalystNotes(data));
  }, [data.station.id, data.dateRange.preset, data.statistics.mean, data.statistics.count]);

  if (!isOpen) return null;

  const handleResetNotes = () => {
    setCustomNotes(buildDefaultAnalystNotes(data));
  };

  const handleDownload = () => {
    setGenerating(true);
    setDownloadSuccess(false);

    try {
      setTimeout(() => {
        generateStationPdfReport(data, user, {
          includeForecastTable: includeForecast,
          executiveNotes: customNotes
        });
        setGenerating(false);
        setDownloadSuccess(true);
        setTimeout(() => {
          onClose();
          setDownloadSuccess(false);
        }, 1200);
      }, 500);
    } catch (err) {
      console.error('PDF export error:', err);
      setGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="export-dialog-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden"
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-emerald-900">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <FileDown className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 id="export-dialog-title" className="font-bold text-base tracking-tight text-white">
                Export Environmental PDF Report
              </h3>
              <p className="text-[11px] text-emerald-400">
                Official Indiana PM2.5 Compliance & Forecast Dossier
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

        {/* Form Body */}
        <div className="p-5 space-y-4 text-xs">
          {/* Test Mode Warning Banner if active */}
          {data.testMode?.active && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start space-x-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block text-xs">
                  TEST MODE ACTIVE: {data.testMode.simulationTitle}
                </span>
                <span className="text-[11px] text-amber-800">
                  Exported report will be clearly watermarked with a QA/QC Test Mode disclaimer to guarantee genuine environmental dossiers are never contaminated.
                </span>
              </div>
            </div>
          )}

          {/* Station Summary Pill */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
            <div>
              <span className="font-bold text-slate-900 text-sm block">
                {data.station.name}
              </span>
              <span className="text-slate-500">
                EPA AQS: {data.station.epaAqsId} • {data.station.county}, {data.station.city}
              </span>
              <span className="text-[10px] text-slate-600 block mt-0.5">
                Sampler: {data.station.monitorType}
              </span>
            </div>
            <div className="text-right">
              <span className="font-semibold text-emerald-700 block">
                {data.dateRange.preset.toUpperCase()} Range
              </span>
              <span className="text-slate-500 font-mono text-[10px]">
                {data.statistics.count} valid hours
              </span>
            </div>
          </div>

          {/* Inclusions checklist */}
          <div className="space-y-2">
            <span className="font-bold text-slate-700 block">
              Report Sections to Include:
            </span>

            <div className="p-2.5 bg-emerald-50/60 border border-emerald-200 rounded-lg space-y-2">
              <div className="flex items-center space-x-2 text-emerald-950 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Station Metadata & Regulatory Attainment Classification</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-950 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Summary Statistics Table (Std Dev, Median, 98th %tile)</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-950 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Time-Series Chart with EPA 35 ug/m3 & 9 ug/m3 Standards</span>
              </div>
              <div className="flex items-center space-x-2 text-emerald-950 font-medium">
                <CheckSquare className="w-4 h-4 text-emerald-600" />
                <span>Data Completeness & QA/QC Transmission Audit</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIncludeForecast(!includeForecast)}
              className="flex items-center space-x-2 text-slate-700 pt-1 cursor-pointer"
            >
              {includeForecast ? (
                <CheckSquare className="w-4 h-4 text-emerald-600" />
              ) : (
                <Square className="w-4 h-4 text-slate-400" />
              )}
              <span>Include 24-Hour Forecast Assessment & Gating Log</span>
            </button>
          </div>

          {/* Consultant Notes Field */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="export-notes" className="font-bold text-slate-700">
                Executive Attainment Summary / Consultant Notes
              </label>
              <button
                type="button"
                onClick={handleResetNotes}
                className="text-[10px] text-emerald-700 hover:text-emerald-800 flex items-center space-x-1 cursor-pointer font-medium"
                title="Reset to selected station's current metrics"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset to Station Defaults</span>
              </button>
            </div>
            <textarea
              id="export-notes"
              rows={4}
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              className="w-full p-2.5 border border-slate-300 rounded-lg text-xs leading-relaxed focus:outline-none focus:ring-2 focus:ring-emerald-500 font-sans"
              placeholder="Add environmental consultant observations..."
            />
            <span className="text-[10px] text-slate-600 mt-1 block">
              Dynamically populated for {data.station.name}. Will be printed in Section 5 of the generated report.
            </span>
          </div>

          {/* Auditor Tag */}
          <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-slate-600">
            <span>Auditor / Analyst:</span>
            <span className="font-semibold text-slate-800">
              {user ? `${user.name} (${user.organization})` : 'EcoInsight Authorized Analyst'}
            </span>
          </div>

          {/* Action button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={generating}
            className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs flex items-center justify-center space-x-2 shadow-sm transition-all cursor-pointer ${
              downloadSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-700 hover:bg-emerald-600 text-white'
            }`}
          >
            {generating ? (
              <span>Compiling Vector PDF Dossier...</span>
            ) : downloadSuccess ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Downloaded Successfully!</span>
              </>
            ) : (
              <>
                <Printer className="w-4 h-4" />
                <span>Generate & Download Technical PDF Report</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
