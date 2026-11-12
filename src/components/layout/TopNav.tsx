import React, { useState, useEffect } from 'react';
import {
  Activity,
  Database,
  Bell,
  RefreshCw,
  Cpu,
  Layers,
} from 'lucide-react';
import { ApiService } from '../../services/api.ts';
import { useToast } from '../common/Toast.tsx';

interface TopNavProps {
  activeModule: string;
  onNavigate: (module: string) => void;
  unreadAlertCount: number;
  onDataReset?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onNavigate,
  unreadAlertCount,
  onDataReset,
}) => {
  const { showToast } = useToast();
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');
  const [backendStatus, setBackendStatus] = useState<{
    online: boolean;
    latencyMs: number;
    dbEngine: string;
  }>({
    online: false,
    latencyMs: 0,
    dbEngine: 'Verifying...',
  });
  const [isResetting, setIsResetting] = useState(false);

  // Live Bengaluru Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format to IST
      const timeStr = now.toLocaleTimeString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
      const dateStr = now.toLocaleDateString('en-IN', {
        timeZone: 'Asia/Kolkata',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      setCurrentTime(`${timeStr} IST`);
      setCurrentDate(dateStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live Backend Prober
  useEffect(() => {
    let isMounted = true;
    const probe = async () => {
      const start = performance.now();
      try {
        const health = await ApiService.getHealth();
        const latency = Math.round(performance.now() - start);
        if (isMounted) {
          setBackendStatus({
            online: health.status === 'ONLINE',
            latencyMs: latency,
            dbEngine: health.database.engine || 'Local Store',
          });
        }
      } catch (err) {
        if (isMounted) {
          setBackendStatus({
            online: false,
            latencyMs: 0,
            dbEngine: 'Disconnected',
          });
        }
      }
    };

    probe();
    const interval = setInterval(probe, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleResetData = async () => {
    if (isResetting) return;
    setIsResetting(true);
    try {
      await ApiService.resetData();
      showToast({
        type: 'success',
        title: 'Database Reset',
        message: 'Bengaluru Digital Twin baseline state has been re-seeded.',
      });
      if (onDataReset) onDataReset();
    } catch (err: any) {
      showToast({
        type: 'error',
        title: 'Reset Failed',
        message: err.message,
      });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <header className="h-16 px-6 bg-slate-950/90 border-b border-slate-800/80 backdrop-blur-md flex items-center justify-between gap-6 shrink-0 z-30">
      {/* Zone 1: Brand Wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Cpu className="w-5 h-5 text-slate-950 font-bold" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="text-base font-bold tracking-tight text-white font-sans">
              NEURAL CITY
            </span>
            <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/50">
              Bengaluru Twin
            </span>
          </div>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            AI Urban Infrastructure Digital Twin
          </p>
        </div>
      </div>

      {/* Zone 2: Real-time System & Telemetry Telemetry */}
      <div className="hidden lg:flex items-center gap-6 text-xs text-slate-400">
        {/* Real-time Clock */}
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono">{currentDate}</span>
          <span className="text-slate-300 font-mono font-medium tracking-tight bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            {currentTime || 'Syncing...'}
          </span>
        </div>

        {/* Backend Connection Prober */}
        <div className="flex items-center gap-2">
          <Activity className={`w-3.5 h-3.5 ${backendStatus.online ? 'text-emerald-400' : 'text-rose-400'}`} />
          <span className="text-slate-400">Engine:</span>
          <span className={`font-mono text-[11px] ${backendStatus.online ? 'text-emerald-400 font-medium' : 'text-rose-400'}`}>
            {backendStatus.online ? `LIVE (${backendStatus.latencyMs}ms)` : 'UNREACHABLE'}
          </span>
        </div>

        {/* Database Status */}
        <div className="flex items-center gap-2">
          <Database className={`w-3.5 h-3.5 ${backendStatus.online ? 'text-cyan-400' : 'text-slate-500'}`} />
          <span className="text-slate-400">Data Store:</span>
          <span className="font-mono text-[11px] text-cyan-300">
            {backendStatus.dbEngine}
          </span>
        </div>
      </div>

      {/* Zone 3: Actions & Operator Profile */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Reset Demonstration Data */}
        <button
          onClick={handleResetData}
          disabled={isResetting}
          title="Reset digital twin data to pristine baseline"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-md border border-slate-800 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isResetting ? 'animate-spin' : ''}`} />
          <span>Reset Demo</span>
        </button>

        {/* Alert Notifications Button */}
        <button
          onClick={() => onNavigate('alerts')}
          className="relative p-2 rounded-md bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors"
          title="View Active Incidents & Alerts"
          aria-label="View Active Incidents"
        >
          <Bell className="w-4 h-4 text-slate-300" />
          {unreadAlertCount > 0 && (
            <span className="absolute -top-1 -right-1 px-1.5 py-0.2 min-w-4.5 h-4.5 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center font-mono">
              {unreadAlertCount}
            </span>
          )}
        </button>

        {/* Operator Profile */}
        <div className="flex items-center gap-2.5 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-md bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700/60 flex items-center justify-center text-xs font-bold text-cyan-400 font-mono">
            BBMP
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-medium text-slate-200">Urban Operations</p>
            <p className="text-[10px] text-slate-400 font-mono">Command Center</p>
          </div>
        </div>
      </div>
    </header>
  );
};
