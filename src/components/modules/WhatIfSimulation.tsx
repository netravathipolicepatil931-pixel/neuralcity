import React, { useState, useEffect } from 'react';
import {
  Sliders,
  Play,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  TrendingUp,
  Activity,
  Layers,
  Zap,
  Droplets,
  CloudRain,
  History,
  ShieldAlert,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { RoadLink, LocationNode, SimulationResult } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

export const WhatIfSimulation: React.FC = () => {
  const { showToast } = useToast();
  const [roads, setRoads] = useState<RoadLink[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);

  // Simulation Sliders
  const [rainfallMmHr, setRainfallMmHr] = useState<number>(65);
  const [drainageCapacityPercent, setDrainageCapacityPercent] = useState<number>(45);
  const [trafficVolumeMultiplier, setTrafficVolumeMultiplier] = useState<number>(1.4);
  const [waterDemandMultiplier, setWaterDemandMultiplier] = useState<number>(1.3);
  const [electricityDemandMultiplier, setElectricityDemandMultiplier] = useState<number>(1.4);
  const [selectedRoadClosures, setSelectedRoadClosures] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [history, setHistory] = useState<SimulationResult[]>([]);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Load initial network
  useEffect(() => {
    Promise.all([
      ApiService.getRoads(),
      ApiService.getLocations(),
      ApiService.getSimulationHistory(),
    ]).then(([rds, locs, hist]) => {
      setRoads(rds);
      setLocations(locs);
      setHistory(hist);
    });
  }, []);

  const handleToggleRoadSelection = (roadId: string) => {
    setSelectedRoadClosures((prev) =>
      prev.includes(roadId) ? prev.filter((id) => id !== roadId) : [...prev, roadId]
    );
  };

  const handleExecute = async () => {
    setLoading(true);
    try {
      const res = await ApiService.executeSimulation({
        rainfallMmHr,
        drainageCapacityPercent,
        trafficVolumeMultiplier,
        waterDemandMultiplier,
        electricityDemandMultiplier,
        roadClosures: selectedRoadClosures,
        emergencyOriginId: 'LOC_MAJESTIC',
        emergencyDestinationId: 'LOC_WHITEFIELD',
      });
      setSimulationResult(res);
      setHistory((prev) => [res, ...prev.slice(0, 9)]);
      showToast({
        type: 'warning',
        title: 'Scenario Simulation Completed',
        message: `City Health Score decreased from ${res.baseline.cityHealthScore} to ${res.simulated.cityHealthScore}. ${res.simulated.highRiskFloodNodesCount} nodes in high flood distress.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Simulation Error',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Run a default simulation on mount once network loads
  useEffect(() => {
    if (locations.length > 0 && !simulationResult) {
      handleExecute();
    }
  }, [locations]);

  const handleResetSliders = () => {
    setRainfallMmHr(15);
    setDrainageCapacityPercent(75);
    setTrafficVolumeMultiplier(1.0);
    setWaterDemandMultiplier(1.0);
    setElectricityDemandMultiplier(1.0);
    setSelectedRoadClosures([]);
    showToast({
      type: 'info',
      title: 'Sliders Reset',
      message: 'Restored baseline environmental parameters.',
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Sliders className="w-4 h-4" />
            <span>Multi-System Disaster Emulator · Module 07</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Connected What-If Urban Disaster Simulation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Simulate cross-domain cascading impacts: Precipitation → Drainage Overload → Road Inundation → Traffic Spillover → Emergency Rerouting → Power Grid Stress.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetSliders}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Sliders</span>
          </button>
          <button
            onClick={() => setShowHistoryModal(!showHistoryModal)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-cyan-400 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <History className="w-3.5 h-3.5" />
            <span>Past Scenarios ({history.length})</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Scenario Controls Panel (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Disaster Stress Drivers
            </span>
            <span className="text-[10px] font-mono text-slate-400">Bengaluru Scale</span>
          </div>

          {/* Rainfall Intensity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                <span>Monsoon Rainfall Intensity</span>
              </span>
              <span className="font-mono text-blue-400 font-bold">{rainfallMmHr} mm/hr</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={rainfallMmHr}
              onChange={(e) => setRainfallMmHr(Number(e.target.value))}
              className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0 (Dry)</span>
              <span>45 (Heavy Monsoon)</span>
              <span>150 (Cloudburst)</span>
            </div>
          </div>

          {/* Drainage Capacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-emerald-400" />
                <span>Rajakaluve Drainage Operational Capacity</span>
              </span>
              <span className="font-mono text-emerald-400 font-bold">{drainageCapacityPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={drainageCapacityPercent}
              onChange={(e) => setDrainageCapacityPercent(Number(e.target.value))}
              className="w-full accent-emerald-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>10% (Silted)</span>
              <span>50% (Partial)</span>
              <span>100% (Desilted)</span>
            </div>
          </div>

          {/* Traffic Volume Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
                <span>Traffic Volume Multiplier</span>
              </span>
              <span className="font-mono text-cyan-400 font-bold">{trafficVolumeMultiplier}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.5"
              step="0.1"
              value={trafficVolumeMultiplier}
              onChange={(e) => setTrafficVolumeMultiplier(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0.5x (Night)</span>
              <span>1.0x (Normal)</span>
              <span>2.5x (Mass Evacuation)</span>
            </div>
          </div>

          {/* Electricity Demand Multiplier */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>Power Grid Load Multiplier</span>
              </span>
              <span className="font-mono text-amber-400 font-bold">{electricityDemandMultiplier}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.2"
              step="0.1"
              value={electricityDemandMultiplier}
              onChange={(e) => setElectricityDemandMultiplier(Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Manual Road Closures Selector */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="text-xs font-semibold text-slate-300 block">
              Simulate Injected Road Closures ({selectedRoadClosures.length} selected)
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
              {roads.map((road) => {
                const isChecked = selectedRoadClosures.includes(road.id);
                return (
                  <label
                    key={road.id}
                    className="flex items-center gap-2 p-2 rounded bg-slate-950/70 border border-slate-800/80 text-[11px] text-slate-300 cursor-pointer hover:border-slate-700"
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggleRoadSelection(road.id)}
                      className="w-3.5 h-3.5 accent-rose-500 rounded"
                    />
                    <span className="truncate flex-1">{road.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{road.distanceKm} km</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* EXECUTE PROMINENT BUTTON */}
          <button
            onClick={handleExecute}
            disabled={loading}
            className="w-full py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-slate-950 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 rounded-xl transition-all shadow-xl shadow-cyan-500/20 flex items-center justify-center gap-2.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Activity className="w-4 h-4 animate-spin text-slate-950" />
                <span>Propagating Cascading Failure Matrix...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>EXECUTE SCENARIO SIMULATION</span>
              </>
            )}
          </button>
        </div>

        {/* Simulation Results Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {simulationResult ? (
            <>
              {/* Baseline vs Simulated Scoreboard */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-slate-100">
                    City Condition Scoreboard: Baseline vs Simulated
                  </h2>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Scenario #{simulationResult.scenarioId.slice(-6)}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {/* Health Score */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400">City Health Score</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-2xl font-bold font-mono text-slate-400 line-through">
                        {simulationResult.baseline.cityHealthScore}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-2xl font-bold font-mono text-rose-400">
                        {simulationResult.simulated.cityHealthScore}
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-400 font-mono">
                      -{Math.round((simulationResult.baseline.cityHealthScore - simulationResult.simulated.cityHealthScore) * 10) / 10} pts
                    </span>
                  </div>

                  {/* Average Congestion */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Avg Congestion</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-400">
                        {simulationResult.baseline.avgCongestionPercent}%
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-xl font-bold font-mono text-amber-400">
                        {simulationResult.simulated.avgCongestionPercent}%
                      </span>
                    </div>
                    <span className="text-[10px] text-amber-400 font-mono">
                      +{simulationResult.simulated.avgCongestionPercent - simulationResult.baseline.avgCongestionPercent}% surge
                    </span>
                  </div>

                  {/* Flood Vulnerable Nodes */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Critical Flood Nodes</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-400">
                        {simulationResult.baseline.highRiskFloodNodesCount}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-xl font-bold font-mono text-rose-400">
                        {simulationResult.simulated.highRiskFloodNodesCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-rose-400 font-mono">of 9 Catchments</span>
                  </div>

                  {/* Open Arterial Roads */}
                  <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Passable Corridors</span>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span className="text-xl font-bold font-mono text-slate-400">
                        {simulationResult.baseline.openRoadsCount}
                      </span>
                      <ArrowRight className="w-3 h-3 text-slate-400" />
                      <span className="text-xl font-bold font-mono text-cyan-300">
                        {simulationResult.simulated.openRoadsCount}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">of 12 Total</span>
                  </div>
                </div>

                {/* At-risk population estimation */}
                <div className="p-3 rounded-lg bg-rose-950/30 border border-rose-800/40 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-rose-300">
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    <span>Estimated At-Risk Ward Population:</span>
                  </div>
                  <span className="text-base font-bold font-mono text-rose-200">
                    {simulationResult.simulated.estimatedAtRiskPopulation.toLocaleString()} citizens
                  </span>
                </div>
              </div>

              {/* Cascading Narrative Chain */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span>Cascading Multi-Hazard Propagation Chain</span>
                </div>

                <div className="space-y-2 pt-1">
                  {simulationResult.cascadingChainSummary.map((item, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                      <span className="w-4 h-4 rounded-full bg-cyan-950 text-cyan-400 border border-cyan-800 text-[10px] font-mono flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span className="leading-relaxed">{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Infrastructure Thermal & Pressure Stress */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Utility Network Stress Scores
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    Water: {simulationResult.infrastructureStress.waterStressScore}/100 · Power: {simulationResult.infrastructureStress.powerGridStressScore}/100
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-1">
                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5" /> High-Temperature Substations:
                    </span>
                    {simulationResult.infrastructureStress.highTempTransformers.length > 0 ? (
                      <ul className="text-slate-300 space-y-1 text-[11px] font-mono">
                        {simulationResult.infrastructureStress.highTempTransformers.map((t) => (
                          <li key={t}>· {t}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400">All transformers within standard IEEE thermal margin.</p>
                    )}
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800 space-y-1.5">
                    <span className="font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5" /> Low-Pressure Water Sectors:
                    </span>
                    {simulationResult.infrastructureStress.lowPressureWaterZones.length > 0 ? (
                      <ul className="text-slate-300 space-y-1 text-[11px] font-mono">
                        {simulationResult.infrastructureStress.lowPressureWaterZones.map((z) => (
                          <li key={z}>· {z}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-[11px] text-slate-400">All sectors maintain hydraulic pressure &gt; 2.5 bar.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Emergency Rerouting Test Impact */}
              <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-3">
                <span className="text-sm font-semibold text-slate-200 block">
                  Simulated Emergency Transit Stress: {simulationResult.emergencyRerouting.originName} → {simulationResult.emergencyRerouting.destinationName}
                </span>

                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-xs">
                  <div>
                    <span className="text-slate-400">Baseline Transit:</span>
                    <span className="font-mono font-bold text-slate-200 ml-1.5">
                      {simulationResult.emergencyRerouting.baselineTimeMin} min
                    </span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="text-slate-400">Simulated Transit:</span>
                    <span className="font-mono font-bold text-rose-400 ml-1.5">
                      {simulationResult.emergencyRerouting.simulatedTimeMin} min
                    </span>
                  </div>
                  <div className="font-mono text-xs px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800">
                    +{simulationResult.emergencyRerouting.timeDeltaPercent}% delay
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400">
              <Sliders className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs">Adjust sliders and click Execute Scenario Simulation to run connected twin model.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
