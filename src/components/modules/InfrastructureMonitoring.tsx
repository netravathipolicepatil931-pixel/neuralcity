import React, { useState, useEffect } from 'react';
import {
  Droplets,
  Zap,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Clock,
  Activity,
  Layers,
  Thermometer,
  Compass,
} from 'lucide-react';
import { WaterSensorReading, ElectricitySensorReading } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

type InfraTab = 'WATER' | 'ELECTRICITY';

export const InfrastructureMonitoring: React.FC = () => {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState<InfraTab>('WATER');
  const [waterSensors, setWaterSensors] = useState<WaterSensorReading[]>([]);
  const [powerSensors, setPowerSensors] = useState<ElectricitySensorReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Optimal' | 'Warning' | 'Critical'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWaterSensor, setSelectedWaterSensor] = useState<WaterSensorReading | null>(null);
  const [selectedPowerSensor, setSelectedPowerSensor] = useState<ElectricitySensorReading | null>(null);

  const fetchTelemetry = async () => {
    setLoading(true);
    try {
      const [waterRes, powerRes] = await Promise.all([
        ApiService.getWaterTelemetry(),
        ApiService.getElectricityTelemetry(),
      ]);
      setWaterSensors(waterRes.sensors);
      setPowerSensors(powerRes.sensors);
      if (!selectedWaterSensor && waterRes.sensors.length > 0) {
        setSelectedWaterSensor(waterRes.sensors[5]); // default KR Market
      }
      if (!selectedPowerSensor && powerRes.sensors.length > 0) {
        setSelectedPowerSensor(powerRes.sensors[2]); // default Majestic
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Telemetry Fetch Failed',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTelemetry();
  }, []);

  // Filtered lists
  const filteredWater = waterSensors.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.sensorStatus === statusFilter;
    const matchesSearch = s.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || s.sensorId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const filteredPower = powerSensors.filter((s) => {
    const matchesStatus = statusFilter === 'ALL' || s.sensorStatus === statusFilter;
    const matchesSearch = s.locationName.toLowerCase().includes(searchQuery.toLowerCase()) || s.sensorId.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Zap className="w-4 h-4" />
            <span>Telemetry Digital Twin · Module 05</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Urban Utility Infrastructure Monitoring
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Continuous telemetry monitoring across Bengaluru water supply mains and 66/11kV electrical substations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-2.5 py-1 text-[10px] font-mono rounded bg-slate-900 text-cyan-400 border border-slate-800">
            SIMULATED TELEMETRY
          </span>
          <button
            onClick={fetchTelemetry}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Main Infrastructure Mode Tabs */}
        <div className="flex items-center p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('WATER')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'WATER'
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4" />
            <span>Water Infrastructure ({waterSensors.length} Sensors)</span>
          </button>
          <button
            onClick={() => setActiveTab('ELECTRICITY')}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'ELECTRICITY'
                ? 'bg-amber-400 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>Electricity Infrastructure ({powerSensors.length} Sub-stations)</span>
          </button>
        </div>

        {/* Status Filters & Search */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by node..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="Optimal">Optimal Only</option>
            <option value="Warning">Warning Only</option>
            <option value="Critical">Critical Only</option>
          </select>
        </div>
      </div>

      {/* Main Content: Split Grid (Left Sensor Cards, Right Historical Time-series Chart) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Sensor List Cards (7 cols) */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span>Select a telemetry node to view 24h historical curve</span>
            <span>
              Showing {activeTab === 'WATER' ? filteredWater.length : filteredPower.length} active sensors
            </span>
          </div>

          {activeTab === 'WATER' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredWater.map((sensor) => {
                const isSelected = selectedWaterSensor?.sensorId === sensor.sensorId;
                return (
                  <div
                    key={sensor.sensorId}
                    onClick={() => setSelectedWaterSensor(sensor)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-900/90 shadow-lg shadow-cyan-950/40'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">{sensor.sensorId}</span>
                        <h3 className="text-sm font-bold text-white">{sensor.locationName}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          sensor.sensorStatus === 'Critical'
                            ? 'bg-rose-950/90 text-rose-400 border border-rose-800/50'
                            : sensor.sensorStatus === 'Warning'
                            ? 'bg-amber-950/90 text-amber-400 border border-amber-800/50'
                            : 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/50'
                        }`}
                      >
                        {sensor.sensorStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Pressure</span>
                        <span className="font-mono font-bold text-cyan-300">{sensor.pipelinePressureBar} bar</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Flow Rate</span>
                        <span className="font-mono font-bold text-slate-200">{sensor.flowRateKlHr} kL/h</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Reservoir</span>
                        <span className="font-mono font-bold text-slate-200">{sensor.reservoirLevelPercent}%</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'ELECTRICITY' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {filteredPower.map((sensor) => {
                const isSelected = selectedPowerSensor?.sensorId === sensor.sensorId;
                return (
                  <div
                    key={sensor.sensorId}
                    onClick={() => setSelectedPowerSensor(sensor)}
                    className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                      isSelected
                        ? 'border-amber-400 bg-slate-900/90 shadow-lg shadow-amber-950/40'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400">{sensor.sensorId}</span>
                        <h3 className="text-sm font-bold text-white">{sensor.locationName}</h3>
                      </div>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          sensor.sensorStatus === 'Critical'
                            ? 'bg-rose-950/90 text-rose-400 border border-rose-800/50'
                            : sensor.sensorStatus === 'Warning'
                            ? 'bg-amber-950/90 text-amber-400 border border-amber-800/50'
                            : 'bg-emerald-950/90 text-emerald-400 border border-emerald-800/50'
                        }`}
                      >
                        {sensor.sensorStatus}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 mt-3 pt-2 border-t border-slate-800/60 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Core Temp</span>
                        <span
                          className={`font-mono font-bold ${
                            sensor.transformerTempC > 75 ? 'text-rose-400' : 'text-amber-300'
                          }`}
                        >
                          {sensor.transformerTempC}°C
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Voltage</span>
                        <span className="font-mono font-bold text-slate-200">{sensor.voltageV} V</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Peak Load</span>
                        <span className="font-mono font-bold text-slate-200">{sensor.powerLoadMva} MVA</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Historical Inspector & Chart (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {activeTab === 'WATER' && selectedWaterSensor && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    Water Diagnostic Inspector
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedWaterSensor.locationName} Sump Main</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedWaterSensor.sensorId}</p>
                </div>
                <Droplets className="w-6 h-6 text-cyan-400" />
              </div>

              {selectedWaterSensor.statusReason && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  {selectedWaterSensor.statusReason}
                </p>
              )}

              {/* 24-Hour Historical Chart */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">24-Hour Pressure Curve (bar)</span>
                  <span className="font-mono text-cyan-400 text-[11px]">Threshold: 2.5 - 4.5 bar</span>
                </div>

                <div className="h-44 w-full flex items-end gap-1.5 pt-4 pb-6 border-b border-slate-800">
                  {selectedWaterSensor.history.map((pt, i) => {
                    const height = `${(pt.pressure / 5.0) * 100}%`;
                    const isBelowMin = pt.pressure < 2.5;

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 z-20 bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow">
                          {pt.pressure} bar ({pt.timestamp})
                        </div>
                        <div
                          style={{ height }}
                          className={`w-full rounded-t transition-all group-hover:brightness-125 ${
                            isBelowMin ? 'bg-amber-400' : 'bg-cyan-400'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>-24 Hours</span>
                  <span>-12 Hours</span>
                  <span>Current Reading</span>
                </div>
              </div>

              {/* Threshold Guidelines */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">Nominal Engineering Envelopes:</span>
                <div>· Pipe Pressure: 2.5 – 4.5 bar (Critical rupture alert below 2.0 bar)</div>
                <div>· Flow Rate: 150 – 400 kL/hr based on ward demand</div>
                <div>· Reservoir Security Minimum: 35% capacity</div>
              </div>
            </div>
          )}

          {activeTab === 'ELECTRICITY' && selectedPowerSensor && (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">
                    Substation Thermal Diagnostic
                  </span>
                  <h3 className="text-lg font-bold text-white">{selectedPowerSensor.locationName} 66/11kV</h3>
                  <p className="text-xs text-slate-400 font-mono">{selectedPowerSensor.sensorId}</p>
                </div>
                <Zap className="w-6 h-6 text-amber-400" />
              </div>

              {selectedPowerSensor.statusReason && (
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/80 p-3 rounded-lg border border-slate-800">
                  {selectedPowerSensor.statusReason}
                </p>
              )}

              {/* 24-Hour Historical Chart */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-200">24-Hour Transformer Temperature (°C)</span>
                  <span className="font-mono text-amber-400 text-[11px]">Threshold: Max 75°C</span>
                </div>

                <div className="h-44 w-full flex items-end gap-1.5 pt-4 pb-6 border-b border-slate-800">
                  {selectedPowerSensor.history.map((pt, i) => {
                    const height = `${(pt.temp / 90) * 100}%`;
                    const isOverheat = pt.temp > 75;

                    return (
                      <div key={i} className="flex-1 flex flex-col items-center h-full justify-end relative group">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-8 z-20 bg-slate-950 border border-slate-700 px-1.5 py-0.5 rounded text-[9px] font-mono whitespace-nowrap shadow">
                          {pt.temp}°C ({pt.timestamp})
                        </div>
                        <div
                          style={{ height }}
                          className={`w-full rounded-t transition-all group-hover:brightness-125 ${
                            isOverheat ? 'bg-rose-500' : 'bg-amber-400'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                  <span>-24 Hours</span>
                  <span>-12 Hours</span>
                  <span>Current Reading</span>
                </div>
              </div>

              {/* Threshold Guidelines */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <span className="font-semibold text-slate-300 block">IEEE C57 Thermal Limits:</span>
                <div>· Normal Continuous Operation: 40°C – 65°C</div>
                <div>· Warning (Auxiliary Fan Bank Engagement): 66°C – 75°C</div>
                <div>· Critical Emergency Load Shedding: &gt; 75°C</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
