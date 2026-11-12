import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/common/Toast.tsx';
import { TopNav } from './components/layout/TopNav.tsx';
import { Sidebar } from './components/layout/Sidebar.tsx';
import { CityOverview } from './components/modules/CityOverview.tsx';
import { GisDigitalTwin } from './components/modules/GisDigitalTwin.tsx';
import { TrafficPrediction } from './components/modules/TrafficPrediction.tsx';
import { FloodPrediction } from './components/modules/FloodPrediction.tsx';
import { InfrastructureMonitoring } from './components/modules/InfrastructureMonitoring.tsx';
import { EmergencyRouting } from './components/modules/EmergencyRouting.tsx';
import { WhatIfSimulation } from './components/modules/WhatIfSimulation.tsx';
import { AlertsIncidents } from './components/modules/AlertsIncidents.tsx';
import { SystemArchitecture } from './components/modules/SystemArchitecture.tsx';
import { ApiService } from './services/api.ts';

function MainApp() {
  const [activeModule, setActiveModule] = useState<string>('overview');
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [unreadAlertCount, setUnreadAlertCount] = useState<number>(2);

  // Pre-selected parameters when navigating across modules
  const [trafficLocationId, setTrafficLocationId] = useState<string>('LOC_SILKBOARD');
  const [floodLocationId, setFloodLocationId] = useState<string>('LOC_SILKBOARD');
  const [routeOriginId, setRouteOriginId] = useState<string>('LOC_MAJESTIC');

  const refreshAlertCount = useCallback(async () => {
    try {
      const alerts = await ApiService.getAlerts();
      const unack = alerts.filter((a) => !a.acknowledged && (a.severity === 'CRITICAL' || a.severity === 'WARNING'));
      setUnreadAlertCount(unack.length);
    } catch (err) {
      // safe fallback
    }
  }, []);

  useEffect(() => {
    refreshAlertCount();
    const interval = setInterval(refreshAlertCount, 20000);
    return () => clearInterval(interval);
  }, [refreshAlertCount]);

  // Deep navigation helpers from GIS inspector
  const handleSelectLocationForTraffic = (locId: string) => {
    setTrafficLocationId(locId);
    setActiveModule('traffic');
  };

  const handleSelectLocationForFlood = (locId: string) => {
    setFloodLocationId(locId);
    setActiveModule('flood');
  };

  const handleSelectLocationForRoute = (locId: string) => {
    setRouteOriginId(locId);
    setActiveModule('emergency');
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans antialiased">
      {/* Top Navigation */}
      <TopNav
        activeModule={activeModule}
        onNavigate={setActiveModule}
        unreadAlertCount={unreadAlertCount}
        onDataReset={refreshAlertCount}
      />

      {/* Main Workspace Body */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Collapsible Sidebar */}
        <Sidebar
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
          alertBadgeCount={unreadAlertCount}
        />

        {/* Viewport Content Area */}
        <main className="flex-1 min-w-0 overflow-y-auto bg-slate-950">
          {activeModule === 'overview' && (
            <CityOverview
              onNavigate={setActiveModule}
              onRefreshAlerts={refreshAlertCount}
            />
          )}

          {activeModule === 'gis' && (
            <GisDigitalTwin
              onSelectLocationForTraffic={handleSelectLocationForTraffic}
              onSelectLocationForFlood={handleSelectLocationForFlood}
              onSelectLocationForRoute={handleSelectLocationForRoute}
            />
          )}

          {activeModule === 'traffic' && (
            <TrafficPrediction initialLocationId={trafficLocationId} />
          )}

          {activeModule === 'flood' && (
            <FloodPrediction initialLocationId={floodLocationId} />
          )}

          {activeModule === 'infrastructure' && (
            <InfrastructureMonitoring />
          )}

          {activeModule === 'emergency' && (
            <EmergencyRouting
              initialOriginId={routeOriginId}
              initialDestinationId="LOC_WHITEFIELD"
            />
          )}

          {activeModule === 'simulation' && (
            <WhatIfSimulation />
          )}

          {activeModule === 'alerts' && (
            <AlertsIncidents onRefreshBadge={refreshAlertCount} />
          )}

          {activeModule === 'architecture' && (
            <SystemArchitecture />
          )}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <MainApp />
    </ToastProvider>
  );
}
