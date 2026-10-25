import React, { useRef } from 'react';
import { useDialogBehavior } from './useDialogBehavior.ts';
import {
  X,
  CheckCircle,
  Key,
  GraduationCap,
  Info,
  Database,
  Layers,
  FileCheck
} from 'lucide-react';

interface ProjectTransparencyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProjectTransparencyModal: React.FC<ProjectTransparencyModalProps> = ({
  isOpen,
  onClose
}) => {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogBehavior(isOpen, onClose, dialogRef);
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="transparency-dialog-title"
        className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-emerald-900 shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-emerald-100" />
            </div>
            <div>
              <h3 id="transparency-dialog-title" className="font-bold text-base tracking-tight text-white">
                Project Lifecycle & Technical Architecture Audit
              </h3>
              <p className="text-[11px] text-emerald-400">
                EcoInsight Analytics • Indiana PM2.5 Environmental Prototype
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close dialog"
            className="p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Executive Overview */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 text-emerald-950">
            <h4 className="font-bold text-sm mb-1 text-emerald-900">
              Prototype Purpose & Academic Scope
            </h4>
            <p className="leading-relaxed">
              Designed as a prototype for environmental consultants, municipal sustainability coordinators, and environmental data analysts to review historical PM2.5 air pollution across Indiana, screen data quality, evaluate short-term predictive trajectories, and export technical reports without manual dataset merging.
            </p>
          </div>

          {/* Section 1: Fully Functional & Server-Side Verified */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center space-x-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>Fully Functional Features (Real Server-Side Operations)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  1. Live Environmental Data Ingestion
                </span>
                <p className="text-slate-600 text-[11px]">
                  Server queries Open-Meteo Air Quality API with real Indiana station coordinates. Zero synthetic data substitution: if upstream retrieval fails, the system returns a clear error rather than fabricated readings.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  2. Strict Hourly Completeness Math
                </span>
                <p className="text-slate-600 text-[11px]">
                  Deduplicates raw records into unique hourly bins. Expected hourly slots are fixed (e.g. 168 for 7 days), ensuring valid observations never exceed expected slots and completeness percentages remain bounded between 0% and 100%.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  3. Accurate CAMS Forecast Method
                </span>
                <p className="text-slate-600 text-[11px]">
                  Forecasts use the Copernicus Atmosphere Monitoring Service (ECMWF CAMS Global) regional dispersion simulation (~40 km grid). Transparently identified as an uncalibrated regional model rather than a local ML model. Full 24-hour table included.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  4. Secure Cryptographic Authentication
                </span>
                <p className="text-slate-600 text-[11px]">
                  Node.js backend with <code>bcryptjs</code> salted password hashing (work factor 10), signed JWT authentication, httpOnly cookies, and persistent JSON user store with role assignments.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  5. Informational Reference Screening
                </span>
                <p className="text-slate-600 text-[11px]">
                  Screens against EPA NAAQS reference lines (24-hr: 35 µg/m³, Annual: 9.0 µg/m³) and the EPA 75% completeness guideline (40 CFR Part 50 Appendix N). Strictly distinguished from formal legal attainment determinations.
                </p>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-semibold text-slate-900 block mb-0.5">
                  6. Downloadable Multi-Page Vector PDF
                </span>
                <p className="text-slate-600 text-[11px]">
                  Client-side <code>jspdf</code> compiler generates a multi-page technical report with zero overlapping text, complete 24-hour forecast table, vector time-series trend line, QA/QC metrics, and consultant notes.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Features Requiring Additional Development / Enterprise Services */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 mb-2 flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-600" />
              <span>Features Needing Further Development & Enterprise Services</span>
            </h4>
            <div className="space-y-2">
              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <span className="font-semibold text-amber-950 block">
                  • Direct State Agency Telemetry (EPA AirNow-Tech Gateway)
                </span>
                <p className="text-amber-900 text-[11px] mt-0.5 leading-relaxed">
                  The prototype relies on Open-Meteo as an environmental reanalysis and atmospheric provider. Direct real-time 1-minute BAM-1020 continuous sampler telemetry requires registered EPA AirNow-Tech API credentials and IDEM data logger access.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <span className="font-semibold text-amber-950 block">
                  • Site-Calibrated Local Machine Learning Model
                </span>
                <p className="text-amber-900 text-[11px] mt-0.5 leading-relaxed">
                  While regional CAMS dispersion forecasts are displayed, building a site-specific forecast model (e.g., PyTorch LSTM or spatio-temporal Graph Neural Network) requires training on multi-year IDEM historical datasets, micrometeorological tower feeds, and local traffic counts.
                </p>
              </div>

              <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-lg">
                <span className="font-semibold text-amber-950 block">
                  • Official 3-Year Regulatory Attainment Certification
                </span>
                <p className="text-amber-900 text-[11px] mt-0.5 leading-relaxed">
                  Under the Clean Air Act, official non-attainment designations require three consecutive calendar years of certified FRM/FEM monitoring data under certified state QAPPs. This software provides informational screening, not legal compliance certification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close Scope Overview
          </button>
        </div>
      </div>
    </div>
  );
};
