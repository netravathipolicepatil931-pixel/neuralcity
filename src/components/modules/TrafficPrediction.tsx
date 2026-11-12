import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CloudRain,
  Clock,
  Gauge,
  Sliders,
  Sparkles,
  Info,
  CheckCircle2,
  AlertTriangle,
  Play,
} from 'lucide-react';
import { LocationNode, TrafficPredictionResult } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface TrafficPredictionProps {
  initialLocationId?: string;
}

export const TrafficPrediction: React.FC<TrafficPredictionProps> = ({ initialLocationId }) => {
  const { showToast } = useToast();
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>(initialLocationId || 'LOC_SILKBOARD');
  const [trafficVolumePcu, setTrafficVolumePcu] = useState<number>(2400);
  const [rainfallMmHr, setRainfallMmHr] = useState<number>(15);
  const [isPeakHour, setIsPeakHour] = useState<boolean>(true);
  const [horizonHours, setHorizonHours] = useState<1 | 2 | 4 | 6 | 12>(4);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<TrafficPredictionResult | null>(null);

  // Load locations
  useEffect(() => {
    ApiService.getLocations().then((locs) => {
      setLocations(locs);
      if (!initialLocationId && locs.length > 0) {
        setSelectedLocationId('LOC_SILKBOARD');
      }
    });
  }, [initialLocationId]);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const res = await ApiService.predictTraffic({
        locationId: selectedLocationId,
        trafficVolumePcu,
        rainfallMmHr,
        isPeakHour,
        horizonHours,
      });
      setResult(res);
      showToast({
        type: 'success',
        title: 'Traffic Forecast Generated',
        message: `${res.locationName}: ${res.predictedCongestionPercent}% congestion (${res.classification}).`,
      });
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Prediction Error',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  // Run initial prediction once locations load
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
            <TrendingUp className="w-4 h-4" />
            <span>AI Predictive Modeling · Module 03</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Arterial Traffic Congestion Forecasting
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ensemble Gradient Boosted Decision Trees trained on Bengaluru Intelligent Transport System (B-TRAC) loop detectors.
          </p>
        </div>

        {result && (
          <div className="flex items-center gap-3 bg-slate-900/80 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-md">
            <span className="text-[11px] text-slate-400">Model Accuracy:</span>
            <span className="font-mono text-xs text-emerald-400 font-bold">R² = {result.modelInfo.r2Score}</span>
            <span className="text-slate-700">·</span>
            <span className="font-mono text-xs text-slate-300">RMSE: {result.modelInfo.rmse} km/h</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input Parameters Panel (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-200">
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Scenario Input Matrix</span>
          </div>

          {/* Location Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Monitored Corridor / Location</label>
            <select
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
            >
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id}>
                  {loc.name} ({loc.zone} · {loc.elevation}m)
                </option>
              ))}
            </select>
          </div>

          {/* Traffic Volume Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Traffic Inflow Rate</span>
              <span className="font-mono text-cyan-400 font-semibold">{trafficVolumePcu} PCU/hr</span>
            </div>
            <input
              type="range"
              min="600"
              max="4500"
              step="100"
              value={trafficVolumePcu}
              onChange={(e) => setTrafficVolumePcu(Number(e.target.value))}
              className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Light (600)</span>
              <span>Nominal (2400)</span>
              <span>Heavy Surge (4500)</span>
            </div>
          </div>

          {/* Rainfall Intensity Slider */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-300">Precipitation Friction</span>
              <span className="font-mono text-blue-400 font-semibold">{rainfallMmHr} mm/hr</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={rainfallMmHr}
              onChange={(e) => setRainfallMmHr(Number(e.target.value))}
              className="w-full accent-blue-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Dry (0 mm)</span>
              <span>Moderate (30 mm)</span>
              <span>Cloudburst (100 mm)</span>
            </div>
          </div>

          {/* Peak Hour Toggle */}
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-slate-200">Commuter Peak Rush Surcharge</p>
              <p className="text-[11px] text-slate-400">Applies 08:30–10:30 & 17:30–20:00 surge matrix</p>
            </div>
            <button
              onClick={() => setIsPeakHour(!isPeakHour)}
              className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                isPeakHour ? 'bg-cyan-500 justify-end' : 'bg-slate-800 justify-start'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-slate-950 shadow-md" />
            </button>
          </div>

          {/* Horizon Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Forecast Horizon</label>
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 4, 6, 12].map((h) => (
                <button
                  key={h}
                  onClick={() => setHorizonHours(h as any)}
                  className={`py-2 text-xs font-mono font-medium rounded-lg border transition-all ${
                    horizonHours === h
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  +{h}h
                </button>
              ))}
            </div>
          </div>

          {/* Submit Predict Button */}
          <button
            onClick={handlePredict}
            disabled={loading}
            className="w-full py-3 px-4 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-xl transition-all shadow-lg shadow-cyan-400/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <TrendingUp className="w-4 h-4 animate-spin" />
                <span>Computing Decision Trees...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>Execute AI Traffic Prediction</span>
              </>
            )}
          </button>
        </div>

        {/* Prediction Results Display (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* Primary Output Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Predicted Congestion */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Predicted Congestion</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-cyan-300">
                      {result.predictedCongestionPercent}%
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Baseline: {locations.find((l) => l.id === result.locationId)?.baselineCongestion}%
                  </div>
                </div>

                {/* Predicted Flow Speed */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Avg Corridor Speed</span>
                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-3xl font-bold font-mono text-emerald-400">
                      {result.predictedSpeedKmh}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">km/h</span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Free Flow Limit: 50 km/h
                  </div>
                </div>

                {/* Congestion Classification */}
                <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
                  <span className="text-xs text-slate-400">Congestion Tier</span>
                  <div className="mt-2">
                    <span
                      className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md inline-block ${
                        result.classification === 'Gridlock Severe'
                          ? 'bg-rose-950/90 text-rose-300 border border-rose-700/50'
                          : result.classification === 'Heavy Congestion'
                          ? 'bg-amber-950/90 text-amber-300 border border-amber-700/50'
                          : result.classification === 'Moderate Congestion'
                          ? 'bg-cyan-950/90 text-cyan-300 border border-cyan-700/50'
                          : 'bg-emerald-950/90 text-emerald-300 border border-emerald-700/50'
                      }`}
                    >
                      {result.classification}
                    </span>
                  </div>
                  <div className="mt-2 text-[11px] text-slate-400">
                    Horizon: +{horizonHours} Hours
                  </div>
                </div>
              </div>

              {/* Trajectory Forecast Chart */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-sm font-semibold text-slate-100">
                      Hourly Trajectory & Confidence Interval (±4.2%)
                    </h2>
                    <p className="text-xs text-slate-400">
                      Forecast for {result.locationName} over next {result.forecastSequence.length} hours
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {new Date(result.predictionTimestamp).toLocaleTimeString()}
                  </span>
                </div>

                {/* Trajectory Visualizer */}
                <div className="h-44 flex items-end gap-3 pt-4 pb-6 border-b border-slate-800">
                  {result.forecastSequence.map((pt) => {
                    const height = `${pt.congestionPercent}%`;
                    return (
                      <div key={pt.hourOffset} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                        {/* Tooltip */}
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 z-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono whitespace-nowrap shadow-xl">
                          <span className="text-cyan-400">{pt.congestionPercent}%</span> · <span className="text-emerald-400">{pt.speedKmh} km/h</span>
                        </div>

                        <div className="w-full max-w-[28px] h-full flex items-end justify-center">
                          <div
                            style={{ height }}
                            className="w-full bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all group-hover:brightness-125 shadow-md shadow-cyan-900/40"
                          />
                        </div>
                        <span className="absolute -bottom-5 text-[10px] font-mono text-slate-400 whitespace-nowrap">
                          {pt.timeLabel.split(' ')[0]}
                        </span>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="flex items-center gap-2">
                    <span className="w-3 h-3 bg-cyan-400 rounded-sm" />
                    <span>Predicted Congestion %</span>
                  </span>
                  <span className="text-slate-400 font-mono text-[11px]">
                    Speed Range: {Math.min(...result.forecastSequence.map((s) => s.speedKmh))} - {Math.max(...result.forecastSequence.map((s) => s.speedKmh))} km/h
                  </span>
                </div>
              </div>

              {/* Contributing Factors Analysis */}
              <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
                <h2 className="text-sm font-semibold text-slate-100">
                  Feature Importance Attribution (SHAP Proxy)
                </h2>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Inflow Volume</span>
                    <p className="font-mono font-bold text-slate-200 mt-0.5">
                      {result.contributingFactors.baseVolumeImpact >= 0 ? '+' : ''}{result.contributingFactors.baseVolumeImpact}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Rainfall Friction</span>
                    <p className="font-mono font-bold text-blue-300 mt-0.5">
                      {result.contributingFactors.rainfallImpact >= 0 ? '+' : ''}{result.contributingFactors.rainfallImpact}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Commuter Rush</span>
                    <p className="font-mono font-bold text-cyan-300 mt-0.5">
                      {result.contributingFactors.peakHourImpact >= 0 ? '+' : ''}{result.contributingFactors.peakHourImpact}%
                    </p>
                  </div>
                  <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800">
                    <span className="text-slate-400 text-[11px]">Node Bottleneck</span>
                    <p className="font-mono font-bold text-amber-300 mt-0.5">
                      {result.contributingFactors.corridorCapacityFactor >= 0 ? '+' : ''}{result.contributingFactors.corridorCapacityFactor}%
                    </p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400">
              <TrendingUp className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs">Select scenario parameters and click Execute to view ML forecast.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
