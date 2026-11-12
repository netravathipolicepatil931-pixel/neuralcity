import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CloudRain,
  Zap,
  Droplets,
  AlertOctagon,
  ArrowRight,
  ShieldCheck,
  Activity,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';
import { CityOverviewData } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface CityOverviewProps {
  onNavigate: (module: string) => void;
  onRefreshAlerts?: () => void;
}

export const CityOverview: React.FC<CityOverviewProps> = ({ onNavigate, onRefreshAlerts }) => {
  const { showToast } = useToast();
  const [data, setData] = useState<CityOverviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ApiService.getDashboard();
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to connect to dashboard API');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      await ApiService.acknowledgeAlert(alertId, 'Command Center Operator');
      showToast({
        type: 'success',
        title: 'Incident Acknowledged',
        message: 'Alert marked as acknowledged in persistent store.',
      });
      fetchDashboard();
      if (onRefreshAlerts) onRefreshAlerts();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Acknowledgment Failed',
        message: err.message,
      });
    } finally {
      setAcknowledgingId(null);
    }
  };

  if (loading && !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-48 rounded-xl bg-slate-900/80 border border-slate-800" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-slate-900/60 border border-slate-800" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-[50vh] text-center">
        <AlertOctagon className="w-12 h-12 text-rose-400 mb-3" />
        <h3 className="text-base font-semibold text-slate-100">Telemetry Stream Unavailable</h3>
        <p className="text-xs text-slate-400 max-w-md mt-1 mb-4">{error}</p>
        <button
          onClick={fetchDashboard}
          className="px-4 py-2 text-xs font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-md transition-colors"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  // Health Score Color
  let healthScoreColor = 'text-emerald-400';
  let healthBg = 'bg-emerald-950/40 border-emerald-500/30';
  if (data.cityHealthScore < 60) {
    healthScoreColor = 'text-rose-400';
    healthBg = 'bg-rose-950/40 border-rose-500/30';
  } else if (data.cityHealthScore < 80) {
    healthScoreColor = 'text-amber-400';
    healthBg = 'bg-amber-950/40 border-amber-500/30';
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Hero Command Banner */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900 shadow-2xl">
        <img
          src="/src/assets/images/neural_city_command_hub_1794468014715.jpg"
          alt="Neural City Bengaluru Urban Command Center"
          referrerPolicy="no-referrer"
          className="w-full h-48 md:h-56 object-cover object-center opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-transparent flex flex-col justify-between p-6 md:p-8">
          <div className="space-y-1.5 max-w-2xl">
            <div className="flex items-center gap-2 text-xs text-cyan-400 font-mono tracking-wide uppercase">
              <Activity className="w-3.5 h-3.5" />
              <span>BBMP Integrated Urban Command · Digital Twin Core</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-white">
              Bengaluru Urban Infrastructure Twin
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed line-clamp-2">
              {data.cityConditionSummary}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onNavigate('gis')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-lg shadow-cyan-400/20"
            >
              <span>Launch GIS Digital Twin</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onNavigate('simulation')}
              className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
            >
              <span>Execute What-If Simulation</span>
            </button>
            <button
              onClick={fetchDashboard}
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900/80 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors ml-auto"
              title="Refresh Telemetry"
              aria-label="Refresh Telemetry"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid - Clickable to modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Overall City Health Score */}
        <div
          onClick={() => onNavigate('gis')}
          className={`p-4 rounded-xl border ${healthBg} backdrop-blur-md cursor-pointer hover:border-cyan-500/50 transition-all group`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">City Health Score</span>
            <ShieldCheck className={`w-4 h-4 ${healthScoreColor}`} />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono tracking-tight ${healthScoreColor}`}>
              {data.cityHealthScore}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Status: {data.cityHealthStatus}</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Inspect <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 2: Traffic Congestion Index */}
        <div
          onClick={() => onNavigate('traffic')}
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Congestion Index</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-bold font-mono tracking-tight text-slate-100">
              {data.trafficCongestionIndex}%
            </span>
            <span className="text-xs text-amber-400 font-mono">
              {data.trafficCongestionLabel}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>9 Locations Monitored</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Forecast <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 3: Flood Vulnerability Level */}
        <div
          onClick={() => onNavigate('flood')}
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md cursor-pointer hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Storm Flood Risk</span>
            <CloudRain className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tracking-tight text-blue-300">
              {data.floodRiskLevel}
            </span>
            <span className="text-xs text-slate-400 font-mono">Catchments</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Silk Board & KR Mkt Alert</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Predict <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>

        {/* Card 4: Active Incidents */}
        <div
          onClick={() => onNavigate('alerts')}
          className="p-4 rounded-xl border border-slate-800 bg-slate-900/70 backdrop-blur-md cursor-pointer hover:border-rose-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Active Incidents</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold font-mono tracking-tight text-rose-400">
              {data.activeCriticalAlertsCount}
            </span>
            <span className="text-xs text-rose-300 font-mono">Critical</span>
            <span className="text-lg font-bold font-mono text-amber-400">
              {data.activeWarningAlertsCount}
            </span>
            <span className="text-xs text-amber-300 font-mono">Warning</span>
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-slate-400">
            <span>Review & Dispatch</span>
            <span className="text-cyan-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5">
              Manage <ArrowRight className="w-3 h-3" />
            </span>
          </div>
        </div>
      </div>

      {/* Charts & Analytical Breakdowns Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Diurnal Traffic Trend (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Diurnal Congestion & Speed Profile</h2>
              <p className="text-xs text-slate-400">Average arterial performance across Bengaluru corridors</p>
            </div>
            <button
              onClick={() => onNavigate('traffic')}
              className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium"
            >
              Open AI Predictor <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          {/* Custom SVG Traffic Trend Chart */}
          <div className="h-56 w-full pt-4">
            <div className="h-full flex items-end gap-2 md:gap-4 relative pb-6 border-b border-slate-800">
              {data.trafficTrendHourly.map((pt) => {
                const heightCongestion = `${pt.avgCongestion}%`;
                const heightSpeed = `${(pt.avgSpeed / 60) * 100}%`;

                return (
                  <div key={pt.hour} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                    {/* Tooltip on hover */}
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-12 z-20 bg-slate-950 border border-slate-700 px-2 py-1 rounded text-[10px] font-mono pointer-events-none whitespace-nowrap shadow-xl">
                      <div className="text-cyan-300">Congestion: {pt.avgCongestion}%</div>
                      <div className="text-emerald-400">Speed: {pt.avgSpeed} km/h</div>
                    </div>

                    <div className="w-full flex items-end justify-center gap-1 h-full">
                      {/* Congestion bar */}
                      <div
                        style={{ height: heightCongestion }}
                        className="w-1/2 max-w-[14px] bg-gradient-to-t from-cyan-600 to-cyan-400 rounded-t transition-all group-hover:brightness-125"
                      />
                      {/* Speed bar */}
                      <div
                        style={{ height: heightSpeed }}
                        className="w-1/2 max-w-[14px] bg-gradient-to-t from-emerald-600/60 to-emerald-400/80 rounded-t transition-all group-hover:brightness-125"
                      />
                    </div>
                    <span className="absolute -bottom-5 text-[10px] text-slate-400 font-mono">
                      {pt.hour}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-cyan-400 rounded-sm" />
                <span>Congestion Index (%)</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-emerald-400 rounded-sm" />
                <span>Average Speed (km/h)</span>
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Peak rush: 09:00 & 18:30</span>
          </div>
        </div>

        {/* Chart 2: Infrastructure Health Subsystem Index */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Subsystem Resiliency</h2>
            <button
              onClick={() => onNavigate('infrastructure')}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Sensors
            </button>
          </div>

          <div className="space-y-3.5 pt-1">
            {data.infrastructureHealthPoints.map((item) => (
              <div key={item.metric} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-300">{item.metric}</span>
                  <span className="font-mono font-medium text-slate-200">{item.score}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    style={{ width: `${item.score}%` }}
                    className={`h-full rounded-full transition-all duration-500 ${
                      item.score > 80
                        ? 'bg-emerald-400'
                        : item.score > 65
                        ? 'bg-cyan-400'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1 text-slate-300">
              <Droplets className="w-3.5 h-3.5 text-cyan-400" />
              <span>Water: {data.waterInfrastructureStatus}</span>
            </span>
            <span className="flex items-center gap-1 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Power: {data.electricityInfrastructureStatus}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Flood Vulnerability Rankings + Recent Incidents Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Flood Vulnerability Ranking */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-100">Catchment Flood Risk</h2>
            <button
              onClick={() => onNavigate('flood')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Full Forecast
            </button>
          </div>

          <div className="space-y-2 pt-1">
            {data.floodVulnerabilityRankings.slice(0, 6).map((rank, i) => (
              <div
                key={rank.locationName}
                className="flex items-center justify-between p-2 rounded-lg bg-slate-950/60 border border-slate-800/60 text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono text-slate-400 w-4">{i + 1}.</span>
                  <span className="text-slate-200 font-medium">{rank.locationName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-slate-400">{rank.riskScore}%</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      rank.level === 'CRITICAL'
                        ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                        : rank.level === 'HIGH'
                        ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {rank.level}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Incidents Table with Quick Acknowledge (2 columns) */}
        <div className="lg:col-span-2 p-5 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">Live Incident Stream</h2>
              <p className="text-xs text-slate-400">Real-time alerts generated by physical threshold sensors</p>
            </div>
            <button
              onClick={() => onNavigate('alerts')}
              className="text-xs text-cyan-400 hover:text-cyan-300 font-medium"
            >
              Alerts Command
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[11px] uppercase font-mono text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Severity</th>
                  <th className="pb-2">Location</th>
                  <th className="pb-2">Incident</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {data.recentAlerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-2.5 font-mono">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          alert.severity === 'CRITICAL'
                            ? 'bg-rose-950/80 text-rose-400 border border-rose-800/50'
                            : alert.severity === 'WARNING'
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800/50'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {alert.severity}
                      </span>
                    </td>
                    <td className="py-2.5 font-medium text-slate-200">{alert.locationName}</td>
                    <td className="py-2.5 max-w-xs truncate text-slate-300" title={alert.title}>
                      {alert.title}
                    </td>
                    <td className="py-2.5 font-mono text-[11px]">
                      {alert.acknowledged ? (
                        <span className="text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Ack
                        </span>
                      ) : (
                        <span className="text-amber-400">Pending</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right">
                      {!alert.acknowledged ? (
                        <button
                          onClick={() => handleQuickAcknowledge(alert.id)}
                          disabled={acknowledgingId === alert.id}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-900 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors"
                        >
                          {acknowledgingId === alert.id ? 'Saving...' : 'Acknowledge'}
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px] font-mono">Logged</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
