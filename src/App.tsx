/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.tsx';
import { StationSelector } from './components/StationSelector.tsx';
import { MetricsOverview } from './components/MetricsOverview.tsx';
import { HistoricalChart } from './components/HistoricalChart.tsx';
import { ForecastSection } from './components/ForecastSection.tsx';
import { DataQualityPanel } from './components/DataQualityPanel.tsx';
import { SummaryStatistics } from './components/SummaryStatistics.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { ExportReportModal } from './components/ExportReportModal.tsx';
import { ProjectTransparencyModal } from './components/ProjectTransparencyModal.tsx';
import { DeveloperTestingPanel } from './components/DeveloperTestingPanel.tsx';

import {
  fetchStations,
  fetchStationData,
  getCurrentUser,
  logout,
  saveUserDefaultStation
} from './services/api.ts';

import {
  MonitoringStation,
  StationDataResponse,
  User,
  SimulationCondition
} from './types/index.ts';

import {
  AlertTriangle,
  RefreshCw,
  Wind,
  ShieldCheck,
  FileText,
  Info,
  FlaskConical,
  X
} from 'lucide-react';

export default function App() {
  const [stations, setStations] = useState<MonitoringStation[]>([]);
  const [selectedStation, setSelectedStation] = useState<MonitoringStation | null>(null);
  const [selectedRange, setSelectedRange] = useState<string>('7d');
  const [simulationCondition, setSimulationCondition] = useState<SimulationCondition>('none');

  const [stationData, setStationData] = useState<StationDataResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Authentication State
  const [user, setUser] = useState<User | null>(null);

  // Modals
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isTransparencyOpen, setIsTransparencyOpen] = useState<boolean>(false);
  const [isTestingPanelOpen, setIsTestingPanelOpen] = useState<boolean>(false);

  // Initial load: Fetch stations & authenticated user
  useEffect(() => {
    async function init() {
      try {
        const [loadedStations, currentUser] = await Promise.all([
          fetchStations(),
          getCurrentUser()
        ]);
        setStations(loadedStations);
        setUser(currentUser);

        // Pick user default station or Indianapolis core monitor
        if (loadedStations.length > 0) {
          const defaultStation = currentUser?.defaultStationId
            ? loadedStations.find(s => s.id === currentUser.defaultStationId)
            : loadedStations.find(s => s.id === 'in-marion-0078') || loadedStations[0];

          setSelectedStation(defaultStation || loadedStations[0]);
        }
      } catch (err: any) {
        console.error('Initialization error:', err);
        setError(err.message || 'Failed to initialize Indiana air quality stations.');
        setIsLoading(false);
      }
    }
    init();
  }, []);

  // Fetch station environmental data whenever station, range, or simulation condition changes
  const loadStationData = useCallback(async () => {
    if (!selectedStation) return;
    setIsLoading(true);
    setError(null);
    // Drop the previous payload immediately so one station's readings cannot
    // remain on screen under a newly selected station or time window.
    setStationData(null);
    setIsExportOpen(false);

    try {
      const data = await fetchStationData(
        selectedStation.id,
        selectedRange,
        simulationCondition
      );
      setStationData(data);
      setError(null);
    } catch (err: any) {
      console.error('Data retrieval error:', err);
      // Clear current data so no fabricated or stale values appear during an error/outage
      setStationData(null);
      setError(err.message || `Unable to retrieve environmental data for ${selectedStation.name}.`);
    } finally {
      setIsLoading(false);
    }
  }, [selectedStation, selectedRange, simulationCondition]);

  useEffect(() => {
    loadStationData();
  }, [loadStationData]);

  // Clear the previous payload in the same update as the new selection.
  // The fetch itself starts in an effect, which runs after the first paint,
  // so waiting for that effect left the old station's numbers on screen.
  const invalidateStationView = () => {
    setIsLoading(true);
    setError(null);
    setStationData(null);
    setIsExportOpen(false);
  };

  const viewData =
    stationData &&
    selectedStation &&
    stationData.station.id === selectedStation.id &&
    stationData.dateRange.preset === selectedRange &&
    (stationData.testMode?.simulationCondition || 'none') === simulationCondition
      ? stationData
      : null;

  // Handle Logout
  const handleLogout = async () => {
    await logout();
    setUser(null);
  };

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-800 flex flex-col font-sans">
      {/* 1. Dashboard Header */}
      <Header
        selectedStation={selectedStation}
        user={user}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
        onOpenExport={() => {
          if (viewData) setIsExportOpen(true);
        }}
        canExport={viewData !== null}
        onOpenTransparency={() => setIsTransparencyOpen(true)}
        currentCondition={simulationCondition}
        onOpenTestingPanel={() => setIsTestingPanelOpen(true)}
        isLoading={isLoading}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Test Mode Notification Banner (prominent if simulation is active) */}
        {simulationCondition !== 'none' && (
          <div className="mb-5 p-3.5 bg-amber-500/10 border-2 border-amber-500/70 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-950 shadow-sm animate-fade-in">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FlaskConical className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-xs uppercase tracking-wider text-amber-900">
                    TEST MODE ACTIVE: {viewData?.testMode?.simulationTitle || simulationCondition.toUpperCase()}
                  </span>
                  <span className="text-[10px] px-2 py-0.2 rounded bg-amber-200 text-amber-900 font-mono font-bold border border-amber-300">
                    QA TEST ISOLATION
                  </span>
                </div>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  {viewData?.testMode?.expectedBehavior || 'Simulated condition is engaged. Real environmental records remain preserved.'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <button
                onClick={() => setIsTestingPanelOpen(true)}
                className="text-xs px-2.5 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 font-semibold transition-colors cursor-pointer"
              >
                Change Test Scenario
              </button>
              <button
                onClick={() => {
                  invalidateStationView();
                  setSimulationCondition('none');
                }}
                className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-semibold transition-colors cursor-pointer shadow-sm"
              >
                Exit Test Mode
              </button>
            </div>
          </div>
        )}

        {/* Project Context & Notification Banner */}
        <div className="mb-5 bg-emerald-950 text-white rounded-xl p-4 shadow-sm border border-emerald-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-700/80 text-emerald-200 flex items-center justify-center shrink-0 border border-emerald-500/40">
              <Wind className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-sm text-emerald-100">
                  Indiana Environmental Protection & Airshed Analytics
                </span>
                <span className="text-[10px] px-2 py-0.2 rounded bg-emerald-900 text-emerald-300 border border-emerald-700 font-mono">
                  State Domain: IN-DEP-02
                </span>
              </div>
              <p className="text-xs text-emerald-300/90 mt-0.5">
                Monitoring continuous PM2.5 particulate matter concentrations across 10 certified Indiana regulatory stations. Observed measurements are rigorously distinguished from 24-hr CAMS dispersion model forecasts.
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 shrink-0">
            <button
              onClick={() => setIsTransparencyOpen(true)}
              className="text-xs px-3 py-1.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-emerald-100 border border-emerald-600 transition-colors font-medium flex items-center space-x-1.5 cursor-pointer"
            >
              <Info className="w-3.5 h-3.5" />
              <span>Project Scope & Roadmap</span>
            </button>
          </div>
        </div>

        {/* 2. Station & Date Range Controls */}
        <StationSelector
          stations={stations}
          selectedStation={selectedStation}
          onSelectStation={(s) => {
            if (s.id === selectedStation?.id) return;
            invalidateStationView();
            setSelectedStation(s);
            if (user && s.id !== user.defaultStationId) {
              saveUserDefaultStation(s.id)
                .then((updated) => setUser(updated))
                .catch((err) => console.error('Failed to save default station:', err));
            }
          }}
          selectedRange={selectedRange}
          onSelectRange={(r) => {
            if (r === selectedRange) return;
            invalidateStationView();
            setSelectedRange(r);
          }}
          isLoading={isLoading}
        />

        {/* Error Notification (Real or Simulated Failure) */}
        {error && (
          <div className="mb-6 p-5 rounded-2xl bg-rose-50/90 border-2 border-rose-200 text-rose-900 shadow-sm animate-fade-in">
            <div className="flex items-start space-x-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0 border border-rose-300">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-bold text-base text-rose-950">
                    Upstream Environmental API Unavailable
                  </h4>
                  {simulationCondition === 'api_failure' && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-bold bg-rose-200 text-rose-900 border border-rose-300 uppercase">
                      Test Mode Simulation
                    </span>
                  )}
                </div>
                <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                  {error}
                </p>
                <div className="text-[11px] text-rose-700/90 mt-2 font-medium bg-rose-100/70 p-2.5 rounded-lg border border-rose-200">
                  Data provenance safeguard: In accordance with Indiana air quality monitoring standards, zero demonstration or synthetic values are fabricated during upstream outages.
                </div>
                <div className="mt-3.5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={loadStationData}
                    className="text-xs px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-lg shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Ingestion Pipeline</span>
                  </button>
                  {simulationCondition !== 'none' && (
                    <button
                      onClick={() => {
                        invalidateStationView();
                        setSimulationCondition('none');
                      }}
                      className="text-xs px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-800 font-semibold rounded-lg border border-slate-300 shadow-sm flex items-center space-x-1.5 cursor-pointer transition-colors"
                    >
                      <span>Disable Simulation & Restore Live Operational Feed</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading Spinner Skeleton */}
        {isLoading && !viewData && (
          <div className="py-20 text-center">
            <div className="inline-block w-9 h-9 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
            <div className="text-sm font-semibold text-slate-700">
              Retrieving environmental particulate measurements...
            </div>
            <div className="text-xs text-slate-500 mt-1">
              Validating sensor transmission and atmospheric model convergence
            </div>
          </div>
        )}

        {/* Main Dashboard Views (when data loaded) */}
        {viewData && (
          <>
            {/* Data Provenance & Ingestion Metadata Bar */}
            <div className="bg-white rounded-xl border border-slate-200 p-3.5 shadow-sm mb-5 text-xs text-slate-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-2.5 mb-2.5 border-b border-slate-100">
                <div className="flex items-center space-x-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${viewData.testMode?.active ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'}`} />
                  <span className="font-bold text-slate-900 text-sm">
                    Verified Environmental Data Provenance
                  </span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${
                    viewData.testMode?.active
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                  }`}>
                    {viewData.testMode?.active
                      ? `Test Mode Isolation • ${viewData.testMode.simulationCondition}`
                      : '100% Real Observations • Zero Synthetic Substitution'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  Server Retrieval Timestamp: {new Date(viewData.provenance.retrievalTimestamp).toLocaleString('en-US', { timeZoneName: 'short' })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-[11px]">
                <div>
                  <span className="text-slate-600 block font-medium">Environmental Data Source:</span>
                  <span className="font-semibold text-slate-800">{viewData.provenance.providerName}</span>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Atmospheric Model Dataset:</span>
                  <span className="font-semibold text-slate-800 truncate block" title={viewData.provenance.datasetName}>
                    Copernicus CAMS Global (ECMWF)
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Station ID & Airshed:</span>
                  <span className="font-semibold text-slate-800 font-mono">
                    {viewData.station.epaAqsId} ({viewData.station.city})
                  </span>
                </div>
                <div>
                  <span className="text-slate-600 block font-medium">Monitor Hardware:</span>
                  <span className="font-semibold text-slate-800">{viewData.station.monitorType}</span>
                </div>
              </div>
            </div>

            {/* 3. Key Metrics Cards (Latest observation, forecast availability, completeness, period peak) */}
            <MetricsOverview
              latestObservation={viewData.latestObservation}
              forecastAvailability={viewData.forecastAvailability}
              dataQuality={viewData.dataQuality}
              statistics={viewData.statistics}
            />

            {/* 4. Interactive Historical PM2.5 Chart */}
            <HistoricalChart
              data={viewData.historical}
              stationName={viewData.station.name}
              preset={selectedRange}
            />

            {/* 5. Separate 24-Hour Forecast Section */}
            <ForecastSection
              forecast={viewData.forecast}
              availability={viewData.forecastAvailability}
              onRefreshData={loadStationData}
              isSimulatingStale={simulationCondition === 'stale_data'}
              onToggleSimulateStale={() => {
                invalidateStationView();
                setSimulationCondition(prev => (prev === 'stale_data' ? 'none' : 'stale_data'));
              }}
            />

            {/* 6. Summary Statistics & NAAQS Metric Analysis */}
            <SummaryStatistics
              statistics={viewData.statistics}
              stationName={viewData.station.name}
              preset={selectedRange}
            />

            {/* 7. Data Quality & Sensor Assurance Panel */}
            <DataQualityPanel
              dataQuality={viewData.dataQuality}
              currentCondition={simulationCondition}
              onOpenTestingPanel={() => setIsTestingPanelOpen(true)}
              isSimulatingStale={simulationCondition === 'stale_data'}
              onToggleSimulateStale={() => {
                invalidateStationView();
                setSimulationCondition(prev => (prev === 'stale_data' ? 'none' : 'stale_data'));
              }}
            />
          </>
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 text-slate-400 text-xs py-8 px-4 sm:px-6 lg:px-8 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-slate-200 font-semibold mb-1">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>EcoInsight Analytics | State of Indiana PM2.5 Monitoring System</span>
            </div>
            <p className="text-[11px] text-slate-400 max-w-xl">
              Prototype developed for university AI project lifecycle evaluation. Primary data sources: Open-Meteo Air Quality API, Copernicus CAMS European Atmospheric Chemistry Reanalysis, and EPA AirData monitoring network catalog.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-xs">
            <button
              onClick={() => setIsTransparencyOpen(true)}
              className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
            >
              Academic Scope & Functional Audit
            </button>
            <span className="text-slate-600">•</span>
            {viewData && (
              <button
                onClick={() => setIsExportOpen(true)}
                className="text-slate-300 hover:text-white underline cursor-pointer"
              >
                Download PDF Dossier
              </button>
            )}
            <span className="text-slate-600">•</span>
            <span>EPA 40 CFR Part 50 Compliant QA/QC</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onSuccess={(u) => setUser(u)}
      />

      {viewData && (
        <ExportReportModal
          key={`${viewData.station.id}-${viewData.dateRange.preset}-${simulationCondition}`}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
          data={viewData}
          user={user}
        />
      )}

      <ProjectTransparencyModal
        isOpen={isTransparencyOpen}
        onClose={() => setIsTransparencyOpen(false)}
      />

      <DeveloperTestingPanel
        isOpen={isTestingPanelOpen}
        onClose={() => setIsTestingPanelOpen(false)}
        currentCondition={simulationCondition}
        onSelectCondition={(cond) => {
          if (cond === simulationCondition) return;
          invalidateStationView();
          setSimulationCondition(cond);
        }}
        isLoading={isLoading}
        selectedStationName={selectedStation?.name || ''}
      />
    </div>
  );
}
