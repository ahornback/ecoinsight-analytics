import React from 'react';
import {
  Wind,
  ShieldCheck,
  FileDown,
  UserCheck,
  LogIn,
  LogOut,
  Info,
  Activity,
  AlertCircle,
  FlaskConical
} from 'lucide-react';
import { User, MonitoringStation, SimulationCondition } from '../types/index.ts';
import { isDevEnvironment } from './DeveloperTestingPanel.tsx';

interface HeaderProps {
  selectedStation: MonitoringStation | null;
  user: User | null;
  onOpenAuth: () => void;
  onLogout: () => void;
  onOpenExport: () => void;
  canExport: boolean;
  onOpenTransparency: () => void;
  currentCondition: SimulationCondition;
  onOpenTestingPanel: () => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedStation,
  user,
  onOpenAuth,
  onLogout,
  onOpenExport,
  canExport,
  onOpenTransparency,
  currentCondition,
  onOpenTestingPanel,
  isLoading
}) => {
  const isDev = isDevEnvironment();
  const isTestActive = currentCondition !== 'none';

  return (
    <header className="bg-slate-900 border-b border-emerald-950 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Platform Name */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600/90 flex items-center justify-center shadow-inner text-white ring-1 ring-emerald-400/40">
              <Wind className="w-6 h-6 text-emerald-100" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight text-white">
                  EcoInsight Analytics
                </span>
                <span className="text-emerald-400 font-medium text-xs px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-800">
                  Indiana PM2.5
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Environmental Air Quality & Forecast Verification System
              </p>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Live Data Feed Pulse */}
            <div className="hidden md:flex items-center space-x-2 px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 text-xs">
              <span className={`w-2 h-2 rounded-full ${isLoading ? 'bg-amber-400 animate-ping' : isTestActive ? 'bg-amber-500' : 'bg-emerald-400 animate-pulse'}`} />
              <span className="text-slate-300">
                {isLoading ? 'Ingesting...' : isTestActive ? `Simulated Feed (${currentCondition})` : 'Live IDEM Stream'}
              </span>
            </div>

            {/* Developer Testing Panel (only available in development or dev flag) */}
            {isDev && (
              <button
                onClick={onOpenTestingPanel}
                title="Open controlled API failure and data quality testing controls"
                className={`text-xs px-2.5 py-1.5 rounded-md border transition-colors flex items-center space-x-1.5 cursor-pointer ${
                  isTestActive
                    ? 'bg-amber-500/25 text-amber-300 border-amber-500/80 ring-1 ring-amber-400/40 animate-pulse font-semibold'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-750 hover:text-white'
                }`}
              >
                <FlaskConical className={`w-3.5 h-3.5 ${isTestActive ? 'text-amber-300' : 'text-amber-400'}`} />
                <span className="hidden sm:inline">Testing Panel</span>
                <span className="text-[10px] px-1 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-700">
                  {isTestActive ? 'TEST ACTIVE' : 'DEV'}
                </span>
              </button>
            )}

            {/* Project Architecture & Methodology */}
            <button
              onClick={onOpenTransparency}
              className="text-xs px-2.5 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Review live architecture, functional features, and academic project specifications"
            >
              <Info className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Project Scope</span>
            </button>

            {/* Export PDF Button */}
            <button
              onClick={onOpenExport}
              disabled={!canExport}
              title={canExport ? 'Export the current station report' : 'A station dataset must be loaded before a report can be exported'}
              className="text-xs px-3 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white font-medium shadow-sm transition-colors flex items-center space-x-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
            >
              <FileDown className="w-4 h-4" />
              <span className="hidden sm:inline">Export PDF Report</span>
              <span className="sm:hidden">PDF</span>
            </button>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200 leading-tight">
                    {user.name}
                  </div>
                  <div className="text-[10px] text-emerald-400 leading-tight">
                    {user.role}
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-800 border border-emerald-600 flex items-center justify-center text-xs font-bold text-emerald-100">
                  {user.name.charAt(0)}
                </div>
                <button
                  type="button"
                  onClick={onLogout}
                  aria-label="Sign out of EcoInsight"
                  title="Sign out of EcoInsight"
                  className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenAuth}
                className="text-xs px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-emerald-400 font-medium border border-emerald-800/80 flex items-center space-x-1.5 transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
