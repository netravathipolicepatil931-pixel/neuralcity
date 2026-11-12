import React, { useState, useEffect } from 'react';
import {
  CloudRain,
  Droplets,
  Sliders,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  Info,
  Play,
  Layers,
  ArrowDownCircle,
  Lightbulb,
} from 'lucide-react';
import { LocationNode, FloodPredictionResult } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface FloodPredictionProps {
  initialLocationId?: string;
}

export const FloodPrediction: React.FC<FloodPredictionProps> = ({ initialLocationId }) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId || 'LOC_SILKBOARD');
  const [rainfallMmHr, setRainfallMmHr] = useState<number>(45);
  const [drainageCapacityPercent, setDrainageCapacityPercent] = useState<number>(55);
  const [soilSaturationPercent, setSoilSaturationPercent] = useState<number>(75);
  const [customElevation, setCustomElevation] = useState<number | undefined>(undefined);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FloodPredictionResult | null>(null);

  // Fetch locations
  useEffect(() => {
    ApiService.getLocations().then((locs) => {
      setLocations(locs);
      if (!initialLocationId && locs.length > 0) {
        setSelectedLocationId('LOC_SILKBOARD');
      }
    });
  }, [initialLocationId]);

  // Sync elevation when location changes
  useEffect(() => {
    const loc = locations.find((l) => l.id === selectedLocationId);
    if (loc) {
      setCustomElevation(loc.elevation);
    }
  }, [selectedLocationId, locations]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await ApiService.predictFlood({
        locationId: selectedLocationId,
        rainfallMmHr,
        drainageCapacityPercent,
        soilSaturationPercent,
        elevationMeters: customElevation,
      });
      setResult(res);
      showToast({
        type: res.classification === 'CRITICAL' || res.classification === 'HIGH' ? 'warning' : 'success',
        title: 'Flood Analysis Generated',
        message: `${res.locationName}: ${res.riskProbabilityPercent}% risk (${res.classification}) · ~${res.estimatedWaterAccumulationCm}cm water depth.`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Analysis Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (locations.length > 0 && !result) {
      handlePredict();
    }
  }, [locations]);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <CloudRain className="w-4 h-4" />
            <span>Hydrological Digital Twin · Module 04</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Stormwater Runoff & Inundation Prediction
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Digital elevation surface modeling coupled with Bengaluru Rajakaluve catchment drainage coefficients.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-md">
            <span className="text-[11px] text-slate-400">Target Contour:</span>
            <span className="font-mono text-xs text-cyan-300 font-bold">{result.elevationMeters}m MSL</span>
            <span className="text-slate-700">·</span>
            <span className="font-mono text-xs text-blue-400">Est. Depth: {result.estimatedWaterAccumulationCm} cm</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Panel (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Hydrology Input Parameters</span>
          </div>

          {/* Location Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Monitored Catchment / Location</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.elevation}m MSL · Baseline: {loc.baselineFloodRisk})
                </option>
              ))}
            </select>
          </div>

          {/* Rainfall Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Rainfall Intensity</span>
              <span className="font-mono text-cyan-400 font-semibold">{rainfallMmHr} mm/hr</span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={rainfallMmHr}
              onChange={(e) => setRainfallMmHr(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Light (5)</span>
              <span>Heavy Monsoon (45)</span>
              <span>Extreme Cloudburst (150)</span>
            </div>
          </div>

          {/* Drainage Capacity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Rajakaluve Drainage Operational Capacity</span>
              <span className="font-mono text-emerald-400 font-semibold">{drainageCapacityPercent}%</span>
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
              <span>Severe Silt / Blocked (10%)</span>
              <span>Nominal (70%)</span>
              <span>Full Desilted (100%)</span>
            </div>
          </div>

          {/* Soil Saturation Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Antecedent Soil Saturation</span>
              <span className="font-mono text-amber-400 font-semibold">{soilSaturationPercent}%</span>
            </div>
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={soilSaturationPercent}
              onChange={(e) => setSoilSaturationPercent(Number(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Dry Soil (10%)</span>
              <span>Moderate (50%)</span>
              <span>100% Saturated (No Infiltration)</span>
            </div>
          </div>

          {/* Elevation Elevation Input */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Topographic Elevation (m MSL)</span>
              <span className="font-mono text-slate-400 text-[11px]">Bengaluru Basin: 885m - 924m</span>
            </div>
            <input
              type="number"
              min="850"
              max="950"
              value={customElevation ?? 900}
              onChange={(e) => setCustomElevation(Number(e.target.value))}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Submit Predict Button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Droplets className="w-4 h-4 animate-spin" />
                <span>Simulating Catchment Runoff...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute Flood Prediction Model</span>
              </>
            )}
          </button>
        </div>

        {/* Results Display Panel (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* Output Scoreboard Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Risk Classification */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Risk Classification</span>
                  <div className="mt-2">
                    <span
                      className={`text-sm font-mono font-bold px-2.5 py-1 rounded-md inline-block ${
                        result.classification === 'CRITICAL'
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-700/50'
                          : result.classification === 'HIGH'
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-700/50'
                          : result.classification === 'MODERATE'
                          ? 'bg-blue-950/90 text-blue-300 border border-blue-700/50'
                          : 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {result.classification}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Location: {result.locationName}
                  </div>
                </div>

                {/* Risk Probability Score */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Risk Probability</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span
                      className={`text-3xl font-bold font-mono ${
                        result.riskProbabilityPercent >= 75
                          ? 'text-rose-400'
                          : result.riskProbabilityPercent >= 50
                          ? 'text-amber-400'
                          : 'text-cyan-300'
                      }`}
                    >
                      {result.riskProbabilityPercent}%
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Topography: {result.elevationMeters}m MSL
                  </div>
                </div>

                {/* Estimated Water Accumulation */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Water Accumulation</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-blue-300">
                      {result.estimatedWaterAccumulationCm}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">cm</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    {result.estimatedWaterAccumulationCm > 25 ? 'Impassable for Cars' : 'Traversable cautiously'}
                  </div>
                </div>
              </div>

              {/* Hydrology Factor Breakdown */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <h2 className="text-sm font-semibold text-slate-100">
                  Hydrological Factor Weighting Matrix
                </h2>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Precipitation Volume Factor (35% weight)</span>
                      <span className="font-mono text-cyan-400 font-medium">{result.contributingFactors.rainfallFactor}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${result.contributingFactors.rainfallFactor}%` }}
                        className="h-full bg-cyan-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Drainage Capacity Deficit (25% weight)</span>
                      <span className="font-mono text-amber-400 font-medium">{result.contributingFactors.drainageDeficitFactor}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${result.contributingFactors.drainageDeficitFactor}%` }}
                        className="h-full bg-amber-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Topographic Depression Severity (25% weight)</span>
                      <span className="font-mono text-rose-400 font-medium">{result.contributingFactors.topographicDepressionFactor}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${result.contributingFactors.topographicDepressionFactor}%` }}
                        className="h-full bg-rose-400 rounded-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-300">Soil Runoff Saturation (15% weight)</span>
                      <span className="font-mono text-blue-400 font-medium">{result.contributingFactors.soilRunoffIndex}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                      <div
                        style={{ width: `${result.contributingFactors.soilRunoffIndex}%` }}
                        className="h-full bg-blue-400 rounded-full"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Physical Hydrology Explanation */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-100">
                  <Info className="w-4 h-4 text-cyan-400" />
                  <span>Physical Hydrology Diagnostic</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-3.5 rounded-lg border border-slate-800/80">
                  {result.explanation}
                </p>

                {/* Mitigation Protocols */}
                {result.mitigationAdvice.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                      <Lightbulb className="w-3.5 h-3.5" />
                      <span>Recommended Response Protocols</span>
                    </div>
                    <ul className="space-y-1.5">
                      {result.mitigationAdvice.map((adv, idx) => (
                        <li key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="text-cyan-400 font-mono text-[11px] shrink-0">{idx + 1}.</span>
                          <span>{adv}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400">
              <CloudRain className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs">Adjust hydrology sliders and click Execute to view flood forecast.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
