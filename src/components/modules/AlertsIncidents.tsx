import React, { useState, useEffect } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  Info,
  CheckCircle2,
  RefreshCw,
  Search,
  Filter,
  MapPin,
  Clock,
  ShieldCheck,
  Plus,
  X,
  Send,
} from 'lucide-react';
import { AlertIncident, LocationNode } from '../../types/index.ts';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface AlertsIncidentsProps {
  onRefreshBadge?: () => void;
}

export const AlertsIncidents: React.FC<AlertsIncidentsProps> = ({ onRefreshBadge }) => {
  const { showToast } = useToast();
  const [alerts, setAlerts] = useState<AlertIncident[]>([]);
  const [locations, setLocations] = useState<LocationNode[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [severityFilter, setSeverityFilter] = useState<'ALL' | 'CRITICAL' | 'WARNING' | 'INFO'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState<string>('ALL');

  // Selected incident for detail drawer
  const [selectedAlert, setSelectedAlert] = useState<AlertIncident | null>(null);
  const [acknowledgingId, setAcknowledgingId] = useState<string | null>(null);

  // Manual incident creation modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'TRAFFIC' | 'FLOOD' | 'WATER' | 'POWER' | 'EMERGENCY'>('FLOOD');
  const [newSeverity, setNewSeverity] = useState<'CRITICAL' | 'WARNING' | 'INFO'>('CRITICAL');
  const [newLocationId, setNewLocationId] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newSuggestedAction, setNewSuggestedAction] = useState('');

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const [alertsRes, locsRes] = await Promise.all([
        ApiService.getAlerts({
          category: categoryFilter,
          severity: severityFilter,
          search: searchQuery,
          locationId: locationFilter !== 'ALL' ? locationFilter : undefined,
        }),
        ApiService.getLocations(),
      ]);
      setAlerts(alertsRes);
      setLocations(locsRes);
      if (!newLocationId && locsRes.length > 0) {
        setNewLocationId(locsRes[0].id);
      }
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Failed to load alerts',
        message: err.message,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, [severityFilter, categoryFilter, locationFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAlerts();
  };

  const handleAcknowledge = async (alertId: string) => {
    setAcknowledgingId(alertId);
    try {
      const res = await ApiService.acknowledgeAlert(alertId, 'Command Center Duty Officer');
      showToast({
        type: 'success',
        title: 'Incident Acknowledged',
        message: `Alert ${alertId} logged as handled by Command Center.`,
      });
      setAlerts((prev) => prev.map((a) => (a.id === alertId ? res.alert : a)));
      if (selectedAlert?.id === alertId) {
        setSelectedAlert(res.alert);
      }
      if (onRefreshBadge) onRefreshBadge();
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

  const handleCreateAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newLocationId || !newDescription) {
      showToast({
        type: 'warning',
        title: 'Validation Error',
        message: 'Please provide Title, Location, and Description.',
      });
      return;
    }

    const loc = locations.find((l) => l.id === newLocationId);
    try {
      const res = await ApiService.createAlert({
        title: newTitle,
        category: newCategory,
        severity: newSeverity,
        locationId: newLocationId,
        locationName: loc?.name || 'Bengaluru Urban Sector',
        description: newDescription,
        suggestedAction: newSuggestedAction || 'Dispatch local zonal quick response team.',
      });

      showToast({
        type: 'success',
        title: 'Incident Reported',
        message: `Incident ${res.alert.id} broadcast across digital twin network.`,
      });

      setShowCreateModal(false);
      setNewTitle('');
      setNewDescription('');
      setNewSuggestedAction('');
      fetchAlerts();
      if (onRefreshBadge) onRefreshBadge();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message,
      });
    }
  };

  const criticalCount = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged).length;
  const warningCount = alerts.filter((a) => a.severity === 'WARNING' && !a.acknowledged).length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <AlertOctagon className="w-4 h-4" />
            <span>Incident Command & Dispatch · Module 08</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            Urban Alert & Incident Command
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Centralized intake of automated sensor triggers, hydraulic alerts, and operator-declared contingencies.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-md shadow-cyan-400/20"
          >
            <Plus className="w-4 h-4 text-slate-950" />
            <span>Broadcast Incident</span>
          </button>
          <button
            onClick={fetchAlerts}
            disabled={loading}
            className="p-2 text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors"
            title="Refresh Incident Stream"
            aria-label="Refresh Incident Stream"
          >
            <RefreshCw className={`w-4 h-4 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Ticker Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 backdrop-blur-md">
          <span className="text-xs text-rose-300">Pending Critical Incidents</span>
          <p className="text-3xl font-bold font-mono text-rose-400 mt-1">{criticalCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-950/20 backdrop-blur-md">
          <span className="text-xs text-amber-300">Pending Warning Incidents</span>
          <p className="text-3xl font-bold font-mono text-amber-400 mt-1">{warningCount}</p>
        </div>
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md">
          <span className="text-xs text-slate-400">Total Stream Records</span>
          <p className="text-3xl font-bold font-mono text-slate-200 mt-1">{alerts.length}</p>
        </div>
        <div className="p-4 rounded-xl border border-emerald-500/30 bg-emerald-950/20 backdrop-blur-md">
          <span className="text-xs text-emerald-300">Acknowledged Rate</span>
          <p className="text-3xl font-bold font-mono text-emerald-400 mt-1">
            {alerts.length > 0 ? Math.round((alerts.filter((a) => a.acknowledged).length / alerts.length) * 100) : 100}%
          </p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 backdrop-blur-md flex flex-wrap items-center justify-between gap-3">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-950 border border-slate-800 rounded-lg">
          {(['ALL', 'CRITICAL', 'WARNING', 'INFO'] as const).map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                severityFilter === sev
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        {/* Category & Location Filters */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Categories</option>
            <option value="FLOOD">Flood</option>
            <option value="TRAFFIC">Traffic</option>
            <option value="WATER">Water</option>
            <option value="POWER">Power</option>
            <option value="EMERGENCY">Emergency</option>
          </select>

          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Bengaluru Nodes</option>
            {locations.map((loc) => (
              <option key={loc.id} value={loc.id}>
                {loc.name}
              </option>
            ))}
          </select>

          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search description..."
              className="pl-8 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-200 placeholder-slate-400 focus:outline-none focus:border-cyan-500 w-44"
            />
          </form>
        </div>
      </div>

      {/* Main Alerts Split: Alert List (7 cols) + Detail Drawer (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-3">
          {loading && alerts.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Loading incident feed...</div>
          ) : alerts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl text-slate-400 text-xs">
              No matching alerts for active filter query.
            </div>
          ) : (
            alerts.map((alert) => {
              const isSelected = selectedAlert?.id === alert.id;

              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer backdrop-blur-md ${
                    isSelected
                      ? 'border-cyan-400 bg-slate-900/90 shadow-lg shadow-cyan-950/40'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                            alert.severity === 'CRITICAL'
                              ? 'bg-rose-950/90 text-rose-300 border border-rose-800/60'
                              : alert.severity === 'WARNING'
                              ? 'bg-amber-950/90 text-amber-300 border border-amber-800/60'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {alert.severity}
                        </span>
                        <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                          {alert.category}
                        </span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          {alert.locationName}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white truncate">{alert.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                        {alert.description}
                      </p>
                    </div>

                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className="text-[10px] text-slate-400 font-mono">
                        {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {alert.acknowledged ? (
                        <span className="text-emerald-400 text-[11px] font-mono flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Handled
                        </span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAcknowledge(alert.id);
                          }}
                          disabled={acknowledgingId === alert.id}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded transition-colors shadow"
                        >
                          {acknowledgingId === alert.id ? 'Saving...' : 'Acknowledge'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Detail Drawer (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedAlert ? (
            <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/70 backdrop-blur-md space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider">
                    Incident Diagnostic Docket
                  </span>
                  <h3 className="text-base font-bold text-white mt-0.5">{selectedAlert.title}</h3>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400 font-mono">
                    <span>{selectedAlert.id}</span>
                    <span>·</span>
                    <span>{new Date(selectedAlert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedAlert(null)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                  aria-label="Close Docket"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Status and Location Grid */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Severity Rating</span>
                  <p
                    className={`font-mono font-bold mt-0.5 ${
                      selectedAlert.severity === 'CRITICAL'
                        ? 'text-rose-400'
                        : selectedAlert.severity === 'WARNING'
                        ? 'text-amber-400'
                        : 'text-slate-300'
                    }`}
                  >
                    {selectedAlert.severity}
                  </p>
                </div>
                <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800">
                  <span className="text-slate-400 text-[10px]">Location Node</span>
                  <p className="font-mono font-bold text-slate-200 mt-0.5">
                    {selectedAlert.locationName}
                  </p>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-300">Situation Report</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-lg border border-slate-800">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Suggested Standard Action */}
              <div className="space-y-1">
                <span className="text-xs font-semibold text-cyan-400">Prescribed Response Protocol</span>
                <p className="text-xs text-slate-300 leading-relaxed bg-cyan-950/30 p-3 rounded-lg border border-cyan-800/40">
                  {selectedAlert.suggestedAction}
                </p>
              </div>

              {/* Telemetry Snapshot if available */}
              {selectedAlert.telemetrySnapshot && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-slate-300">Sensor Telemetry at Trigger</span>
                  <pre className="text-[11px] font-mono text-cyan-300 bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
                    {JSON.stringify(selectedAlert.telemetrySnapshot, null, 2)}
                  </pre>
                </div>
              )}

              {/* Acknowledgment Information / Button */}
              <div className="pt-2 border-t border-slate-800">
                {selectedAlert.acknowledged ? (
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/40 text-xs text-emerald-300 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                      Acknowledged by {selectedAlert.acknowledgedBy}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-400">
                      {selectedAlert.acknowledgedAt
                        ? new Date(selectedAlert.acknowledgedAt).toLocaleTimeString()
                        : 'Recorded'}
                    </span>
                  </div>
                ) : (
                  <button
                    onClick={() => handleAcknowledge(selectedAlert.id)}
                    disabled={acknowledgingId === selectedAlert.id}
                    className="w-full py-2.5 px-4 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors shadow-lg shadow-cyan-400/20"
                  >
                    {acknowledgingId === selectedAlert.id ? 'Persisting to Store...' : 'Confirm Acknowledgment & Dispatch'}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center border border-dashed border-slate-800 rounded-xl text-slate-400">
              <AlertOctagon className="w-8 h-8 text-slate-400 mb-2" />
              <p className="text-xs">Select any incident to inspect telemetry logs and dispatch actions.</p>
            </div>
          )}
        </div>
      </div>

      {/* Manual Broadcast Incident Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Broadcast Emergency Incident</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-200"
                aria-label="Close Modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateAlert} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Incident Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sump Pump Failure at Hebbal Underpass"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="FLOOD">Flood Hazard</option>
                    <option value="TRAFFIC">Traffic Congestion</option>
                    <option value="WATER">Water Supply</option>
                    <option value="POWER">Power Grid</option>
                    <option value="EMERGENCY">Emergency Response</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-medium text-slate-300">Severity</label>
                  <select
                    value={newSeverity}
                    onChange={(e) => setNewSeverity(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="WARNING">WARNING</option>
                    <option value="INFO">INFO</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Target Node</label>
                <select
                  value={newLocationId}
                  onChange={(e) => setNewLocationId(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                >
                  {locations.map((l) => (
                    <option key={l.id} value={l.id}>
                      {l.name} ({l.zone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Description & Telemetry</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe ground observations, sensor anomalies or physical obstruction..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Recommended Operator Action</label>
                <input
                  type="text"
                  placeholder="e.g. Deploy auxiliary pump unit and notify Bangalore Traffic Police"
                  value={newSuggestedAction}
                  onChange={(e) => setNewSuggestedAction(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Broadcast to Network</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
