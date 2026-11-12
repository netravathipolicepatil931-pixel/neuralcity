import React, { useState, useEffect } from 'react';
import {
  Ambulance,
  Flame,
  LifeBuoy,
  Navigation,
  MapPin,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  Play,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { LocationNode, RoadLink, EmergencyRouteResult } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface EmergencyRoutingProps {
  initialOriginId?: string;
  initialDestinationId?: string;
}

export const EmergencyRouting: React.FC<EmergencyRoutingProps> = ({
  initialOriginId,
  initialDestinationId,
}) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [roads, setRoads] = useState<RoadLink[]>([]);
  const [vehicleType, setVehicleType] = useState<'Ambulance' | 'Fire Brigade' | 'Disaster Rescue'>('Ambulance');
  const [originId, setOriginId] = useState<string>(initialOriginId || 'LOC_MAJESTIC');
  const [destinationId, setDestinationId] = useState<string>(initialDestinationId || 'LOC_WHITEFIELD');
  const [avoidClosedRoads, setAvoidClosedRoads] = useState<boolean>(true);
  const [considerTraffic, setConsiderTraffic] = useState<boolean>(true);
  const [considerFlood, setConsiderFlood] = useState<boolean>(true);

  const [loading, setLoading] = useState(false);
  const [routeResult, setRouteResult] = useState<EmergencyRouteResult | null>(null);
  const [previousRouteNodeNames, setPreviousRouteNodeNames] = useState<string[]>([]);

  // Load locations and roads
  const loadNetwork = async () => {
    try {
      const [locs, rds] = await Promise.all([
        ApiService.getLocations(),
        ApiService.getRoads(),
      ]);
      setLocations(locs);
      setRoads(rds);
    } catch (err) {
      console.error('Network load error:', err);
    }
  };

  useEffect(() => {
    loadNetwork();
  }, []);

  const handleCalculateRoute = async () => {
    if (originId === destinationId) {
      showToast({
        type: 'warning',
        title: 'Invalid Routing',
        message: 'Origin and destination must be distinct Bengaluru nodes.',
      });
      return;
    }

    setLoading(true);
    try {
      if (routeResult) {
        setPreviousRouteNodeNames(routeResult.routeNodeNames);
      }

      const res = await ApiService.calculateEmergencyRoute({
        vehicleType,
        originId,
        destinationId,
        avoidClosedRoads,
        considerTraffic,
        considerFlood,
      });

      setRouteResult(res);

      if (res.routeSegments.length > 0) {
        showToast({
          type: 'success',
          title: 'Emergency Route Optimized',
          message: `${res.totalDistanceKm} km · Est. ${res.estimatedTravelTimeMin} min via ${res.routeNodeNames.join(' -> ')}`,
        });
      } else {
        showToast({
          type: 'error',
          title: 'No Passable Route Found',
          message: 'All arterial paths are blocked by closures or deep flood barriers.',
        });
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Routing Computation Error',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Initial calculation when locations load
  useEffect(() => {
    if (locations.length > 0 && !routeResult) {
      handleCalculateRoute();
    }
  }, [locations]);

  // Handle dynamic road closure on route
  const handleToggleRoad = async (roadId: string) => {
    const road = roads.find((r) => r.id === roadId);
    if (!road) return;

    try {
      const nextState = !road.isClosed;
      const res = await ApiService.toggleRoadClosure(
        roadId,
        nextState,
        nextState ? 'Dynamic road block applied during emergency drill' : undefined
      );

      // Update local roads
      setRoads((prev) => prev.map((r) => (r.id === roadId ? res.road : r)));

      showToast({
        type: nextState ? 'warning' : 'success',
        title: nextState ? 'Corridor Closed' : 'Corridor Reopened',
        message: `${road.name} is now ${nextState ? 'blocked' : 'open'}. Recalculating path...`,
      });

      // Recalculate route immediately with new graph weights!
      setTimeout(() => {
        handleCalculateRoute();
      }, 300);
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Corridor Toggle Failed',
        message: err.message,
      });
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Navigation className="w-4 h-4" />
            <span>Graph Optimization Engine · Module 06</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Emergency Priority Route Optimization
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time Dijkstra shortest & lowest-risk path graph solver factoring traffic congestion friction, waterlogging depth, and road blockades.
          </p>
        </div>

        {/* Demo Scenario Quick-Load */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              setOriginId('LOC_MAJESTIC');
              setDestinationId('LOC_WHITEFIELD');
              setTimeout(handleCalculateRoute, 100);
            }}
            className="px-3 py-1.5 text-xs text-cyan-300 bg-cyan-950/70 border border-cyan-800/60 rounded-lg hover:bg-cyan-900/80 transition-colors"
          >
            Load Hackathon Scenario (Majestic → Whitefield)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Routing Input Parameters (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Dispatch Configuration</span>
          </div>

          {/* Vehicle Type Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Emergency Unit Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setVehicleType('Ambulance')}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  vehicleType === 'Ambulance'
                    ? 'bg-rose-950/90 text-rose-300 border-rose-500/60 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Ambulance className="w-4 h-4 text-rose-400" />
                <span>Ambulance</span>
              </button>

              <button
                onClick={() => setVehicleType('Fire Brigade')}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  vehicleType === 'Fire Brigade'
                    ? 'bg-amber-950/90 text-amber-300 border-amber-500/60 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Flame className="w-4 h-4 text-amber-400" />
                <span>Fire Brigade</span>
              </button>

              <button
                onClick={() => setVehicleType('Disaster Rescue')}
                className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-all ${
                  vehicleType === 'Disaster Rescue'
                    ? 'bg-cyan-950/90 text-cyan-300 border-cyan-500/60 shadow'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <LifeBuoy className="w-4 h-4 text-cyan-400" />
                <span>Disaster Unit</span>
              </button>
            </div>
          </div>

          {/* Origin & Destination Selectors */}
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span>Dispatch Origin</span>
              </label>
              <select
                value={originId}
                onChange={(e) => setOriginId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.zone})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span>Emergency Destination</span>
              </label>
              <select
                value={destinationId}
                onChange={(e) => setDestinationId(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
              >
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dynamic Constraint Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">Dijkstra Cost Constraints</span>

            <div className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span>Avoid Closed / Blocked Roads</span>
              <input
                type="checkbox"
                checked={avoidClosedRoads}
                onChange={(e) => setAvoidClosedRoads(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span>Apply Real-Time Traffic Delays</span>
              <input
                type="checkbox"
                checked={considerTraffic}
                onChange={(e) => setConsiderTraffic(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-300 p-2 rounded-lg bg-slate-950/70 border border-slate-800/80">
              <span>Penalize Storm Waterlogging</span>
              <input
                type="checkbox"
                checked={considerFlood}
                onChange={(e) => setConsiderFlood(e.target.checked)}
                className="w-4 h-4 accent-cyan-400 rounded cursor-pointer"
              />
            </div>
          </div>

          {/* Calculate Route Button */}
          <button
            onClick={handleCalculateRoute}
            disabled={loading}
            className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Navigation className="w-4 h-4 animate-spin" />
                <span>Running Dijkstra Graph Solver...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Compute Optimal Route</span>
              </>
            )}
          </button>
        </div>

        {/* Route Results & Dynamic Road Closure Demonstration (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {routeResult ? (
            <>
              {/* Scoreboard Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Total Distance</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-mono text-cyan-300">
                      {routeResult.totalDistanceKm}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">km</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Segments: {routeResult.routeSegments.length} Links
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Est. Dispatch Time</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-mono text-emerald-400">
                      {routeResult.estimatedTravelTimeMin}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">min</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Vehicle: {routeResult.vehicleType}
                  </div>
                </div>

                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Corridors Avoided</span>
                  <div className="mt-1 flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-mono text-amber-400">
                      {routeResult.avoidedRoads.length}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">Corridors</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Bypassed hazards
                  </div>
                </div>
              </div>

              {/* Path Node Sequence Breadcrumb */}
              <div className="p-4 rounded-xl border border-cyan-500/30 bg-cyan-950/30 backdrop-blur-md space-y-2">
                <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                  Computed Optimal Path
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {routeResult.routeNodeNames.map((nodeName, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2.5 py-1 text-xs font-bold font-mono rounded bg-slate-900 text-slate-100 border border-slate-700 shadow-sm">
                        {nodeName}
                      </span>
                      {idx < routeResult.routeNodeNames.length - 1 && (
                        <ArrowRight className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                      )}
                    </React.Fragment>
                  ))}
                </div>
              </div>

              {/* Dynamic Road Closure Demonstration Panel */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Dynamic Road Closure Test (Hackathon Workflow)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Toggle a corridor on the active route to verify instant Dijkstra recalculation
                    </p>
                  </div>
                </div>

                <div className="space-y-2 pt-1">
                  {routeResult.routeSegments.map((seg) => {
                    const isClosed = seg.isClosed || roads.find((r) => r.id === seg.roadId)?.isClosed;
                    return (
                      <div
                        key={seg.roadId}
                        className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs"
                      >
                        <div className="space-y-0.5">
                          <span className="font-semibold text-slate-200 block">{seg.roadName}</span>
                          <span className="text-[11px] text-slate-400 font-mono">
                            {seg.fromNodeName} → {seg.toNodeName} · {seg.distanceKm} km · {seg.travelTimeMin} min
                          </span>
                        </div>
                        <button
                          onClick={() => handleToggleRoad(seg.roadId)}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                            isClosed
                              ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
                              : 'bg-rose-500/90 hover:bg-rose-400 text-white'
                          }`}
                        >
                          {isClosed ? 'Reopen Road' : 'Simulate Closure'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Avoided Corridors with Concrete Explanations */}
              {routeResult.avoidedRoads.length > 0 && (
                <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    <span>Corridors Avoided by Dijkstra & Exact Explanations</span>
                  </div>

                  <div className="space-y-2">
                    {routeResult.avoidedRoads.map((avoided) => (
                      <div
                        key={avoided.roadId}
                        className="p-3 rounded-lg bg-slate-950/70 border border-amber-900/30 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{avoided.roadName}</span>
                          <span className="text-[10px] font-mono text-amber-400">
                            {avoided.fromNodeName} ↔ {avoided.toNodeName}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 leading-relaxed">
                          Reason: <span className="text-amber-300/90">{avoided.reason}</span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Turn-by-Turn Guidance */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
                <span className="text-xs font-semibold text-slate-200 block">
                  Turn-by-Turn Telemetry Guidance
                </span>
                <ul className="space-y-2">
                  {routeResult.navigationInstructions.map((step, idx) => (
                    <li key={idx} className="text-xs text-slate-300 flex items-start gap-2.5">
                      <span className="w-5 h-5 rounded-full bg-slate-800 text-cyan-400 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400">
              <Navigation className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs">Select origin and destination to solve optimal emergency route.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
