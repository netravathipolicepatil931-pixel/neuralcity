import React from 'react';
import {
  LayoutDashboard,
  MapPin,
  TrendingUp,
  CloudRain,
  Zap,
  Ambulance,
  Sliders,
  AlertOctagon,
  Network,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface SidebarProps {
  activeModule: string;
  onSelectModule: (module: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  alertBadgeCount: number;
}

export const NAV_ITEMS = [
  { id: 'overview', label: 'City Overview', icon: LayoutDashboard },
  { id: 'gis', label: 'GIS Digital Twin', icon: MapPin },
  { id: 'traffic', label: 'Traffic Prediction', icon: TrendingUp },
  { id: 'flood', label: 'Flood Prediction', icon: CloudRain },
  { id: 'infrastructure', label: 'Infrastructure Monitoring', icon: Zap },
  { id: 'emergency', label: 'Emergency Routing', icon: Ambulance },
  { id: 'simulation', label: 'What-If Simulation', icon: Sliders },
  { id: 'alerts', label: 'Alerts & Incidents', icon: AlertOctagon },
  { id: 'architecture', label: 'System Architecture', icon: Network },
];

export const Sidebar: React.FC<SidebarProps> = ({
  activeModule,
  onSelectModule,
  collapsed,
  onToggleCollapse,
  alertBadgeCount,
}) => {
  return (
    <aside
      className={`relative z-20 flex flex-col bg-slate-950 border-r border-slate-800/80 transition-all duration-300 ease-in-out shrink-0 select-none ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Navigation Modules List */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        <div className={`px-3 py-1 mb-2 text-[10px] font-mono tracking-wider uppercase text-slate-400 ${collapsed ? 'hidden' : 'block'}`}>
          Digital Twin Modules
        </div>

        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeModule === item.id;
          const isAlerts = item.id === 'alerts';

          return (
            <button
              key={item.id}
              onClick={() => onSelectModule(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all relative group ${
                isActive
                  ? 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 shadow-sm shadow-cyan-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60 border border-transparent'
              }`}
            >
              {/* Active Indicator Bar */}
              {isActive && (
                <span className="absolute left-0 top-1.5 bottom-1.5 w-1 bg-cyan-400 rounded-r-full" />
              )}

              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                }`}
              />

              {!collapsed && (
                <span className="flex-1 text-left truncate tracking-tight">{item.label}</span>
              )}

              {/* Alert Badge */}
              {isAlerts && alertBadgeCount > 0 && (
                <span
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-rose-500/90 text-white font-mono shrink-0 ${
                    collapsed ? 'absolute top-1 right-1' : ''
                  }`}
                >
                  {alertBadgeCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Monitored Locations Quick Summary in Expanded State */}
      {!collapsed && (
        <div className="p-3 mx-2 mb-3 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] uppercase font-mono text-slate-400">
            <span>Bengaluru Nodes</span>
            <span className="text-cyan-400">9 Active</span>
          </div>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            Hebbal · Yelahanka · Majestic · MG Rd · Indiranagar · KR Mkt · Koramangala · Silk Board · Whitefield
          </p>
        </div>
      )}

      {/* Collapse / Expand Toggle Button */}
      <div className="p-3 border-t border-slate-800/80 flex items-center justify-between">
        {!collapsed && (
          <span className="text-[11px] text-slate-400 font-mono">v2.4 Smart Twin</span>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-1.5 rounded-md text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors ml-auto"
          title={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          aria-label={collapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
};
