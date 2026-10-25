import React, { useState } from 'react';
import {
  MapPin,
  Calendar,
  Layers,
  ChevronDown,
  Search,
  Check,
  Building,
  Info
} from 'lucide-react';
import { MonitoringStation } from '../types/index.ts';

interface StationSelectorProps {
  stations: MonitoringStation[];
  selectedStation: MonitoringStation | null;
  onSelectStation: (station: MonitoringStation) => void;
  selectedRange: string;
  onSelectRange: (range: string) => void;
  isLoading: boolean;
}

export const StationSelector: React.FC<StationSelectorProps> = ({
  stations,
  selectedStation,
  onSelectStation,
  selectedRange,
  onSelectRange,
  isLoading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showStationDetails, setShowStationDetails] = useState(false);

  const rangeOptions = [
    { id: '24h', label: '24 Hours', desc: 'Hourly resolution' },
    { id: '48h', label: '48 Hours', desc: 'Diurnal comparison' },
    { id: '7d', label: '7 Days', desc: 'Weekly trend' },
    { id: '14d', label: '14 Days', desc: 'Two-week cycle' },
    { id: '30d', label: '30 Days', desc: 'Monthly baseline' }
  ];

  const filteredStations = stations.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.county.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.epaAqsId.includes(searchQuery)
  );

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-sm mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Station Selector Dropdown */}
        <div className="flex-1 relative">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Indiana Air Quality Monitoring Station</span>
            </span>
            {selectedStation && (
              <button
                type="button"
                onClick={() => setShowStationDetails(!showStationDetails)}
                className="text-[11px] text-emerald-600 hover:text-emerald-700 font-medium flex items-center space-x-1 underline cursor-pointer"
              >
                <Info className="w-3 h-3" />
                <span>{showStationDetails ? 'Hide Site Specs' : 'View Site Specs'}</span>
              </button>
            )}
          </label>

          <button
            type="button"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-label={selectedStation ? `Monitoring station: ${selectedStation.name}` : 'Select an Indiana monitoring station'}
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-slate-50 hover:bg-slate-100/80 border border-slate-300/80 rounded-lg px-3.5 py-2.5 text-left flex items-center justify-between transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            {selectedStation ? (
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs shrink-0">
                  IN
                </div>
                <div className="truncate">
                  <div className="font-semibold text-slate-900 text-sm truncate flex items-center space-x-2">
                    <span>{selectedStation.name}</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-700">
                      AQS: {selectedStation.epaAqsId}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 truncate">
                    {selectedStation.county} • {selectedStation.monitorType} • {selectedStation.stationClassification}
                  </div>
                </div>
              </div>
            ) : (
              <span className="text-slate-500 text-sm">Select an Indiana monitoring station...</span>
            )}
            <ChevronDown className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Dropdown Menu */}
          {isOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setIsOpen(false)}
              />
              <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-96 flex flex-col">
                <div className="p-2 border-b border-slate-100 bg-slate-50">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-2.5 top-2.5" />
                    <input
                      type="text"
                      aria-label="Search stations by city, county, or EPA AQS ID"
                      placeholder="Search by city, county, or EPA AQS ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                  </div>
                </div>

                <div className="overflow-y-auto divide-y divide-slate-100 max-h-72">
                  {filteredStations.map((station) => {
                    const isSelected = selectedStation?.id === station.id;
                    return (
                      <button
                        key={station.id}
                        type="button"
                        onClick={() => {
                          onSelectStation(station);
                          setIsOpen(false);
                        }}
                        className={`w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-center justify-between ${
                          isSelected ? 'bg-emerald-50/70' : ''
                        }`}
                      >
                        <div>
                          <div className="font-medium text-xs sm:text-sm text-slate-900 flex items-center space-x-2">
                            <span>{station.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 border border-slate-200">
                              {station.epaAqsId}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {station.county} • {station.city} • Elev: {station.elevationMeters}m
                          </div>
                          <div className="text-[11px] text-emerald-700 mt-0.5 font-medium">
                            {station.monitorType} ({station.stationClassification})
                          </div>
                        </div>
                        {isSelected && (
                          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                  {filteredStations.length === 0 && (
                    <div className="p-4 text-center text-xs text-slate-500">
                      No Indiana monitoring stations match your search.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Date Range Selector */}
        <div className="lg:w-auto shrink-0">
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center space-x-1.5">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>Historical Observation Window</span>
          </label>
          <div className="flex items-center space-x-1.5 bg-slate-100/80 p-1 rounded-lg border border-slate-200/80">
            {rangeOptions.map((opt) => {
              const isActive = selectedRange === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onSelectRange(opt.id)}
                  disabled={isLoading}
                  title={opt.desc}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all cursor-pointer ${
                    isActive
                      ? 'bg-emerald-700 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/70'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Expanded Station Details Drawer */}
      {showStationDetails && selectedStation && (
        <div className="mt-4 pt-4 border-t border-slate-100 bg-slate-50/70 rounded-lg p-3.5 text-xs text-slate-700">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <span className="font-semibold text-slate-900 block">Site Operator:</span>
              <span className="text-slate-600">{selectedStation.operator}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block">EPA Site Coordinates:</span>
              <span className="text-slate-600 font-mono">
                {selectedStation.latitude.toFixed(4)}° N, {selectedStation.longitude.toFixed(4)}° W
              </span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block">Physical Location:</span>
              <span className="text-slate-600">{selectedStation.address}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-900 block">Station Classification:</span>
              <span className="text-emerald-700 font-medium">{selectedStation.stationClassification}</span>
            </div>
          </div>
          <p className="mt-2 text-slate-500 italic text-[11px] border-t border-slate-200/60 pt-2">
            Airshed Description: {selectedStation.description}
          </p>
        </div>
      )}
    </div>
  );
};
