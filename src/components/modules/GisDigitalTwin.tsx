import React, { useState, useEffect, useMemo } from 'react';
import {
  MapPin,
  Search,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Layers,
  Activity,
  AlertTriangle,
  Droplets,
  Zap,
  TrendingUp,
  X,
  Compass,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import { LocationNode, RoadLink } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface GisDigitalTwinProps {
  onSelectLocationForTraffic?: (locId: string) => void;
  onSelectLocationForFlood?: (locId: string) => void;
  onSelectLocationForRoute?: (locId: string) => void;
}

type LayerMode = 'ALL' | 'TRAFFIC' | 'FLOOD' | 'SENSORS';

export const GisDigitalTwin: React.FC<GisDigitalTwinProps> = ({
  onSelectLocationForTraffic,
  onSelectLocationForFlood,
  onSelectLocationForRoute,
}) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [roads, setRoads] = useState<RoadLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeLayer, setActiveLayer] = useState<LayerMode>('ALL');
  const [selectedLocation, setSelectedLocation] = useState<LocationNode | null>(null);
  const [selectedRoad, setSelectedRoad] = useState<RoadLink | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [showSatelliteBackdrop, setShowSatelliteBackdrop] = useState(false);

  // Fetch locations and roads
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [locsRes, roadsRes] = await Promise.all([
        ApiService.getLocations(),
        ApiService.getRoads(),
      ]);
      setLocations(locsRes);
      setRoads(roadsRes);
      // Auto select Majestic by default if none selected
      if (!selectedLocation && locsRes.length > 2) {
        setSelectedLocation(locsRes[2]);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load GIS twin layers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute bounding box and normalize coordinates to SVG viewBox (1000 x 800)
  // Bengaluru bounds approx:
  // Lat: 12.9100 (South) to 13.1100 (North) -> Delta ~0.20
  // Lng: 77.5600 (West) to 77.7600 (East) -> Delta ~0.20
  const SVG_WIDTH = 1000;
  const SVG_HEIGHT = 760;
  const PADDING = 70;

  const projectCoord = (lat: number, lng: number) => {
    const minLat = 12.905;
    const maxLat = 13.115;
    const minLng = 77.555;
    const maxLng = 77.765;

    // Invert lat because higher latitude is further North (top of screen, lower Y)
    const normX = (lng - minLng) / (maxLng - minLng);
    const normY = (maxLat - lat) / (maxLat - minLat);

    const x = PADDING + normX * (SVG_WIDTH - 2 * PADDING);
    const y = PADDING + normY * (SVG_HEIGHT - 2 * PADDING);
    return { x, y };
  };

  // Precompute projected coordinates for all locations
  const projectedNodes = useMemo(() => {
    const map = new Map<string, { x: number; y: number }>();
    locations.forEach((loc) => {
      map.set(loc.id, projectCoord(loc.lat, loc.lng));
    });
    return map;
  }, [locations]);

  // Filtered locations
  const filteredLocations = useMemo(() => {
    if (!searchQuery) return locations;
    return locations.filter(
      (l) =>
        l.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        l.zone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [locations, searchQuery]);

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(Math.max(prev + delta, 0.75), 2.5));
  };

  const handleResetZoom = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const handleSelectLocation = (loc: LocationNode) => {
    setSelectedLocation(loc);
    setSelectedRoad(null);
  };

  const handleSelectRoad = (road: RoadLink) => {
    setSelectedRoad(road);
    setSelectedLocation(null);
  };

  const handleToggleRoadClosure = async (road: RoadLink) => {
    try {
      const nextState = !road.isClosed;
      const res = await ApiService.toggleRoadClosure(
        road.id,
        nextState,
        nextState ? 'Operational road block test by command center' : undefined
      );
      showToast({
        type: nextState ? 'warning' : 'success',
        title: nextState ? 'Corridor Closed' : 'Corridor Reopened',
        message: `${road.name} is now ${nextState ? 'closed to emergency transit' : 'reopened'}.`,
      });
      setRoads((prev) => prev.map((r) => (r.id === road.id ? res.road : r)));
      if (selectedRoad?.id === road.id) {
        setSelectedRoad(res.road);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Action Failed',
        message: err.message,
      });
    }
  };

  if (loading && locations.length === 0) {
    return (
      <div className="p-8 h-[80vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Layers className="w-8 h-8 text-cyan-400 animate-spin" />
          <p className="text-xs font-mono">Synchronizing Bengaluru GIS Spatial Layers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col lg:flex-row overflow-hidden bg-slate-950">
      {/* Main Interactive Map Viewport */}
      <div className="flex-1 relative flex flex-col min-h-0 overflow-hidden bg-[#070b13]">
        {/* Top Floating Map Controls Toolbar */}
        <div className="absolute top-4 left-4 right-4 z-10 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
          {/* Layer Selector Segmented Control */}
          <div className="pointer-events-auto flex items-center gap-1 p-1 bg-slate-900/90 border border-slate-800 rounded-lg shadow-xl backdrop-blur-md">
            <button
              onClick={() => setActiveLayer('ALL')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeLayer === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Infrastructure
            </button>
            <button
              onClick={() => setActiveLayer('TRAFFIC')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeLayer === 'TRAFFIC'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Traffic Flow
            </button>
            <button
              onClick={() => setActiveLayer('FLOOD')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeLayer === 'FLOOD'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Flood Vulnerability
            </button>
            <button
              onClick={() => setActiveLayer('SENSORS')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                activeLayer === 'SENSORS'
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Sensors
            </button>
          </div>

          {/* Search & Backdrop Toggle */}
          <div className="pointer-events-auto flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search 9 Bengaluru nodes..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-900/90 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44 md:w-56 backdrop-blur-md"
              />
            </div>

            <button
              onClick={() => setShowSatelliteBackdrop(!showSatelliteBackdrop)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
                showSatelliteBackdrop
                  ? 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50'
                  : 'bg-slate-900/90 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              {showSatelliteBackdrop ? 'Satellite Vector' : 'Dark Cartography'}
            </button>
          </div>
        </div>

        {/* Map Canvas SVG Area */}
        <div className="flex-1 w-full h-full relative overflow-hidden flex items-center justify-center select-none">
          {/* Optional Satellite Backdrop Image */}
          {showSatelliteBackdrop && (
            <img
              src="/src/assets/images/bengaluru_gis_twin_satellite_1794468014745.jpg"
              alt="Bengaluru Satellite Twin"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover opacity-20 pointer-events-none"
            />
          )}

          {/* Grid Background Pattern */}
          <div
            className="absolute inset-0 opacity-15 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, rgba(6, 182, 212, 0.4) 1px, transparent 0)`,
              backgroundSize: '36px 36px',
            }}
          />

          {/* SVG Map Container */}
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            className="w-full h-full max-w-full max-h-full transition-transform duration-300"
            style={{
              transform: `scale(${zoomLevel}) translate(${panOffset.x}px, ${panOffset.y}px)`,
            }}
          >
            <defs>
              {/* Glow filter for active roads */}
              <filter id="cyanGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Topographic Elevation Contour Rings (Background) */}
            <g className="opacity-15 stroke-slate-700 fill-none" strokeWidth="0.8" strokeDasharray="3,3">
              <ellipse cx="480" cy="380" rx="420" ry="320" />
              <ellipse cx="460" cy="390" rx="320" ry="240" />
              <ellipse cx="440" cy="400" rx="200" ry="160" />
            </g>

            {/* Road Network Lines */}
            <g className="roads-layer">
              {roads.map((road) => {
                const fromP = projectedNodes.get(road.fromNodeId);
                const toP = projectedNodes.get(road.toNodeId);
                if (!fromP || !toP) return null;

                const isSelected = selectedRoad?.id === road.id;

                // Color based on activeLayer
                let strokeColor = '#38bdf8'; // Default cyan
                let strokeWidth = isSelected ? 5.5 : 3.5;
                let strokeDasharray = 'none';

                if (road.isClosed) {
                  strokeColor = '#f43f5e'; // Red
                  strokeDasharray = '6,4';
                } else if (activeLayer === 'TRAFFIC') {
                  if (road.currentCongestion >= 85) strokeColor = '#ef4444'; // Red
                  else if (road.currentCongestion >= 70) strokeColor = '#f97316'; // Orange
                  else if (road.currentCongestion >= 50) strokeColor = '#eab308'; // Amber
                  else strokeColor = '#10b981'; // Green
                } else if (activeLayer === 'FLOOD') {
                  if (road.waterAccumulationCm > 20) strokeColor = '#a855f7'; // Purple waterlogged
                  else if (road.waterAccumulationCm > 10) strokeColor = '#3b82f6'; // Blue
                  else strokeColor = '#06b6d4';
                }

                // Midpoint for road label
                const midX = (fromP.x + toP.x) / 2;
                const midY = (fromP.y + toP.y) / 2;

                return (
                  <g key={road.id} className="cursor-pointer group" onClick={() => handleSelectRoad(road)}>
                    {/* Invisible fat hit-area for easy clicking */}
                    <line
                      x1={fromP.x}
                      y1={fromP.y}
                      x2={toP.x}
                      y2={toP.y}
                      stroke="transparent"
                      strokeWidth="20"
                    />

                    {/* Road base stroke */}
                    <line
                      x1={fromP.x}
                      y1={fromP.y}
                      x2={toP.x}
                      y2={toP.y}
                      stroke={strokeColor}
                      strokeWidth={strokeWidth}
                      strokeDasharray={strokeDasharray}
                      strokeLinecap="round"
                      opacity={isSelected ? 1 : 0.85}
                      filter={isSelected ? 'url(#cyanGlow)' : undefined}
                      className="transition-all duration-200 group-hover:stroke-cyan-300"
                    />

                    {/* Road Metric Badge at Midpoint */}
                    <g transform={`translate(${midX}, ${midY})`}>
                      <rect
                        x="-20"
                        y="-10"
                        width="40"
                        height="20"
                        rx="4"
                        fill="#090d16"
                        stroke={strokeColor}
                        strokeWidth="1"
                        opacity="0.9"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fill="#e2e8f0"
                        fontSize="9"
                        fontFamily="monospace"
                        fontWeight="bold"
                      >
                        {road.isClosed ? 'CLOSED' : `${road.currentCongestion}%`}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>

            {/* Location Node Markers */}
            <g className="nodes-layer">
              {filteredLocations.map((loc) => {
                const pos = projectedNodes.get(loc.id);
                if (!pos) return null;

                const isSelected = selectedLocation?.id === loc.id;

                // Color based on layer
                let nodeRingColor = '#06b6d4';
                let innerFill = '#0f172a';

                if (activeLayer === 'FLOOD') {
                  if (loc.baselineFloodRisk === 'CRITICAL') nodeRingColor = '#f43f5e';
                  else if (loc.baselineFloodRisk === 'HIGH') nodeRingColor = '#f97316';
                  else if (loc.baselineFloodRisk === 'MODERATE') nodeRingColor = '#eab308';
                  else nodeRingColor = '#10b981';
                } else if (activeLayer === 'TRAFFIC') {
                  if (loc.baselineCongestion > 80) nodeRingColor = '#ef4444';
                  else if (loc.baselineCongestion > 65) nodeRingColor = '#f97316';
                  else nodeRingColor = '#06b6d4';
                }

                return (
                  <g
                    key={loc.id}
                    transform={`translate(${pos.x}, ${pos.y})`}
                    className="cursor-pointer group"
                    onClick={() => handleSelectLocation(loc)}
                  >
                    {/* Selected Halo Pulse */}
                    {isSelected && (
                      <circle
                        r="24"
                        fill="none"
                        stroke="#06b6d4"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        className="animate-spin"
                        style={{ animationDuration: '8s' }}
                      />
                    )}

                    {/* Outer marker ring */}
                    <circle
                      r={isSelected ? 14 : 11}
                      fill={innerFill}
                      stroke={nodeRingColor}
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all duration-200 group-hover:r-[15px]"
                    />

                    {/* Center glowing core */}
                    <circle
                      r={isSelected ? 6 : 4}
                      fill={nodeRingColor}
                      className="transition-all"
                    />

                    {/* Location Name Label */}
                    <text
                      y={isSelected ? 30 : 26}
                      textAnchor="middle"
                      fill="#f8fafc"
                      fontSize={isSelected ? "13" : "11"}
                      fontWeight={isSelected ? "bold" : "600"}
                      className="pointer-events-none drop-shadow-md tracking-tight font-sans"
                    >
                      {loc.name}
                    </text>

                    {/* Elevation or Risk Tag */}
                    <text
                      y={isSelected ? 43 : 38}
                      textAnchor="middle"
                      fill="#94a3b8"
                      fontSize="9"
                      fontFamily="monospace"
                      className="pointer-events-none drop-shadow"
                    >
                      {loc.elevation}m · {loc.shortName}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>

          {/* Map Compass Rose & Bottom Legend */}
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-4 bg-slate-950/90 border border-slate-800/80 px-4 py-2.5 rounded-xl shadow-xl backdrop-blur-md text-xs">
            <div className="flex items-center gap-1.5 text-cyan-400 font-mono text-[11px]">
              <Compass className="w-4 h-4" />
              <span>N 12.9716° · E 77.5946°</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-3 text-[11px] text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Free Flow
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" /> Congested
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Severe / Closed
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-400" /> Waterlogged
              </span>
            </div>
          </div>

          {/* Zoom Control Buttons (Bottom Right) */}
          <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1.5 bg-slate-900/90 border border-slate-800 p-1 rounded-lg shadow-xl backdrop-blur-md">
            <button
              onClick={() => handleZoom(0.25)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title="Zoom In"
              aria-label="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleZoom(-0.25)}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title="Zoom Out"
              aria-label="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleResetZoom}
              className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-800 rounded transition-colors"
              title="Reset View"
              aria-label="Reset View"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Inspector Panel */}
      <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950/95 overflow-y-auto p-5 space-y-5 shrink-0 z-20">
        {selectedLocation && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/40">
                    {selectedLocation.zone}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">Ward #{selectedLocation.wardNumber}</span>
                </div>
                <h2 className="text-xl font-bold text-white mt-1">{selectedLocation.name}</h2>
              </div>
              <button
                onClick={() => setSelectedLocation(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
                aria-label="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {selectedLocation.description}
            </p>

            {/* Core Physical & Digital Twin Parameters */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Elevation</span>
                <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                  {selectedLocation.elevation} m MSL
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Ward Population</span>
                <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                  {selectedLocation.population.toLocaleString()}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Baseline Traffic</span>
                <p className="text-base font-bold font-mono text-cyan-400 mt-0.5">
                  {selectedLocation.baselineCongestion}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Flood Risk Profile</span>
                <p
                  className={`text-base font-bold font-mono mt-0.5 ${
                    selectedLocation.baselineFloodRisk === 'CRITICAL'
                      ? 'text-rose-400'
                      : selectedLocation.baselineFloodRisk === 'HIGH'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                >
                  {selectedLocation.baselineFloodRisk}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Water Pressure</span>
                <p className="text-base font-bold font-mono text-slate-200 mt-0.5">
                  {selectedLocation.baselineWaterPressure} bar
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Substation Load</span>
                <p className="text-base font-bold font-mono text-amber-300 mt-0.5">
                  {selectedLocation.baselinePowerLoad} MVA
                </p>
              </div>
            </div>

            {/* Quick Simulation Action Triggers */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <span className="text-xs font-semibold text-slate-300">Targeted AI Operations</span>
              <button
                onClick={() => onSelectLocationForTraffic && onSelectLocationForTraffic(selectedLocation.id)}
                className="w-full flex items-center justify-between p-2.5 text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Run AI Traffic Forecast</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onSelectLocationForFlood && onSelectLocationForFlood(selectedLocation.id)}
                className="w-full flex items-center justify-between p-2.5 text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Droplets className="w-3.5 h-3.5 text-blue-400" />
                  <span>Evaluate Storm Flood Model</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => onSelectLocationForRoute && onSelectLocationForRoute(selectedLocation.id)}
                className="w-full flex items-center justify-between p-2.5 text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors group"
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Plan Emergency Route From Here</span>
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
        )}

        {selectedRoad && (
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  Arterial Corridor
                </span>
                <h2 className="text-base font-bold text-white mt-1">{selectedRoad.name}</h2>
              </div>
              <button
                onClick={() => setSelectedRoad(null)}
                className="text-slate-400 hover:text-slate-200 p-1"
                aria-label="Close Inspector"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Length</span>
                <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                  {selectedRoad.distanceKm} km
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Corridor Lanes</span>
                <p className="text-base font-bold font-mono text-slate-100 mt-0.5">
                  {selectedRoad.lanes} Lanes
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Current Congestion</span>
                <p className="text-base font-bold font-mono text-amber-400 mt-0.5">
                  {selectedRoad.currentCongestion}%
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Flow Speed</span>
                <p className="text-base font-bold font-mono text-emerald-400 mt-0.5">
                  {selectedRoad.currentSpeedKmh} km/h
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Water Accumulation</span>
                <p className="text-base font-bold font-mono text-blue-300 mt-0.5">
                  {selectedRoad.waterAccumulationCm} cm
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                <span className="text-[11px] text-slate-400">Operational Status</span>
                <p
                  className={`text-base font-bold font-mono mt-0.5 ${
                    selectedRoad.isClosed ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {selectedRoad.isClosed ? 'CLOSED' : 'OPEN'}
                </p>
              </div>
            </div>

            {selectedRoad.closureReason && (
              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/40 text-xs text-rose-300 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Closure Notice</span>
                </div>
                <p className="text-[11px] leading-relaxed text-rose-300/80">
                  {selectedRoad.closureReason}
                </p>
              </div>
            )}

            {/* Dynamic Road Closure Toggle Button */}
            <div className="pt-2">
              <button
                onClick={() => handleToggleRoadClosure(selectedRoad)}
                className={`w-full py-2.5 px-4 text-xs font-semibold rounded-lg transition-all shadow-lg ${
                  selectedRoad.isClosed
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                    : 'bg-rose-500 hover:bg-rose-400 text-white'
                }`}
              >
                {selectedRoad.isClosed ? 'Reopen This Corridor' : 'Simulate Road Block / Closure'}
              </button>
              <p className="text-[10px] text-slate-400 text-center mt-1.5">
                Alters emergency routing graphs and cascading simulation immediately.
              </p>
            </div>
          </div>
        )}

        {!selectedLocation && !selectedRoad && (
          <div className="py-12 text-center text-slate-400 space-y-2">
            <MapPin className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs">Click on any location node or road link on the map to inspect physical parameters.</p>
          </div>
        )}
      </div>
    </div>
  );
};
