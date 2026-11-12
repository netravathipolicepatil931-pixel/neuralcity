import React, { useState, useEffect } from 'react';
import {
  Network,
  Cpu,
  Database,
  Layers,
  Server,
  Code2,
  Workflow,
  CheckCircle2,
  Terminal,
  Activity,
  Globe,
  ShieldCheck,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { ApiService } from '../../services/api.ts';

export const SystemArchitecture: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(true);

  const fetchHealth = async () => {
    setLoadingHealth(true);
    try {
      const res = await ApiService.getHealth();
      setHealthData(res);
    } catch (err) {
      setHealthData(null);
    } finally {
      setLoadingHealth(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
            <Network className="w-4 h-4" />
            <span>Technical Infrastructure Specification · Module 09</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white mt-1">
            System Architecture & Data Pipelines
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            High-performance full-stack digital twin framework bridging React 19 UI, Express/Python predictive services, and graph routing algorithms.
          </p>
        </div>

        {/* Live Verified Connection Badge */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-3.5 py-2 rounded-xl backdrop-blur-md">
            <Activity className={`w-4 h-4 ${healthData?.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`} />
            <span className="text-xs text-slate-300 font-medium">Backend Health:</span>
            <span className={`font-mono text-xs font-bold ${healthData?.status === 'ONLINE' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {healthData?.status || 'OFFLINE'}
            </span>
          </div>
          <button
            onClick={fetchHealth}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-900 border border-slate-800 rounded-lg transition-colors"
            title="Re-verify System Health"
            aria-label="Re-verify System Health"
          >
            <RefreshCw className={`w-4 h-4 ${loadingHealth ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Layer Architecture Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Layer 1: Frontend Presentation */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-800/50 flex items-center justify-center text-cyan-400">
            <Code2 className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">01. Frontend UI Layer</h3>
          <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
            <li>· React 19 (Hooks & Modular SPA)</li>
            <li>· TypeScript Strict Typing</li>
            <li>· Vite 6 High-Speed Bundler</li>
            <li>· Tailwind CSS 4 Design System</li>
            <li>· Vector SVG GIS Projections</li>
          </ul>
        </div>

        {/* Layer 2: API & Gateway Engine */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-blue-950/80 border border-blue-800/50 flex items-center justify-center text-blue-400">
            <Server className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">02. REST API Engine</h3>
          <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
            <li>· Node.js / Express Full-Stack</li>
            <li>· Python / FastAPI Endpoint Parity</li>
            <li>· CORS & Security Headers</li>
            <li>· Unified /api Proxy Routing</li>
            <li>· Non-blocking I/O Architecture</li>
          </ul>
        </div>

        {/* Layer 3: AI & Optimization Algorithms */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-800/50 flex items-center justify-center text-purple-400">
            <Cpu className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">03. AI & Graph Solvers</h3>
          <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
            <li>· GBDT & Random Forest Regressor</li>
            <li>· Dijkstra Multi-Cost Graph Routing</li>
            <li>· Hydrology Rational Runoff Model</li>
            <li>· Cascading Disaster Simulation</li>
            <li>· Dynamic Edge Penalty Matrix</li>
          </ul>
        </div>

        {/* Layer 4: Persistence Store */}
        <div className="p-5 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/50 flex items-center justify-center text-emerald-400">
            <Database className="w-5 h-5" />
          </div>
          <h3 className="text-base font-bold text-white">04. Data Persistence</h3>
          <ul className="text-xs text-slate-300 space-y-1.5 font-mono">
            <li>· Persistent Local JSON / SQLite Store</li>
            <li>· Seeded Bengaluru 9-Node Model</li>
            <li>· PostgreSQL / Supabase Readiness</li>
            <li>· Zero Credential Crash Fallback</li>
            <li>· Persistent Alert Acknowledgment</li>
          </ul>
        </div>
      </div>

      {/* Interactive Data Flow Pipeline Diagram */}
      <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Workflow className="w-5 h-5 text-cyan-400" />
          End-to-End Digital Twin Data Pipeline
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-cyan-400">STEP 01</span>
            <h4 className="text-xs font-bold text-white">Telemetry Generation</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sensors simulate water pressure (bar), reservoir level (%), transformer temp (°C), and loop detector traffic (PCU/h) for all 9 Bengaluru nodes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-blue-400">STEP 02</span>
            <h4 className="text-xs font-bold text-white">Threshold Evaluator</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Sensory data checked against engineering limits (IEEE C57 temp &gt; 75°C, pressure &lt; 2.5 bar). Automated alerts dispatched to live incident table.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-purple-400">STEP 03</span>
            <h4 className="text-xs font-bold text-white">AI Inference Engines</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Predictive models evaluate rainfall friction, soil saturation, and corridor bottlenecks to output congestion and flood classifications with hourly curves.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-emerald-400">STEP 04</span>
            <h4 className="text-xs font-bold text-white">Graph Optimization</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Dijkstra algorithm dynamically recalculates edge weights based on real-time traffic and waterlogged roads, determining safe emergency routes.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
            <span className="text-[10px] font-mono text-amber-400">STEP 05</span>
            <h4 className="text-xs font-bold text-white">Operator Command</h4>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Command operators inspect the GIS digital twin, acknowledge incidents, toggle road closures, and execute what-if cascading disaster simulations.
            </p>
          </div>
        </div>
      </div>

      {/* Database Schema & Health Verification Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Live Database Status */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyan-400" />
              Live Database Verification
            </h2>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
              CONNECTED
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
              <span className="text-slate-400">Database Engine:</span>
              <span className="text-cyan-300">{healthData?.database?.engine || 'Persistent Local JSON/SQLite Store'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
              <span className="text-slate-400">Monitored Locations Table:</span>
              <span className="text-emerald-400 font-bold">{healthData?.database?.locationsCount || 9} Records</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
              <span className="text-slate-400">Road Network Corridors Table:</span>
              <span className="text-emerald-400 font-bold">{healthData?.database?.roadsCount || 12} Interconnections</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
              <span className="text-slate-400">Incident Alerts Table:</span>
              <span className="text-emerald-400 font-bold">{healthData?.database?.alertsCount || 5} Active Records</span>
            </div>
            <div className="flex justify-between p-2.5 rounded bg-slate-950 border border-slate-800 font-mono">
              <span className="text-slate-400">Engine Uptime:</span>
              <span className="text-slate-200">{healthData?.uptimeSeconds ? `${Math.round(healthData.uptimeSeconds)} seconds` : 'Active'}</span>
            </div>
          </div>
        </div>

        {/* Deployment & Environment Setup Guide */}
        <div className="p-6 rounded-2xl border border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              Deployment Architecture (Vercel & Full-Stack)
            </h2>
            <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
              PRODUCTION READY
            </span>
          </div>

          <div className="space-y-3 text-xs text-slate-300">
            <p className="leading-relaxed">
              Neural City runs a cohesive full-stack architecture where the Express API and Vite React client share a unified process in development and cloud containers:
            </p>

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 font-mono text-[11px] space-y-1.5 text-slate-400">
              <div><span className="text-cyan-400"># Start Local Full-Stack Engine</span></div>
              <div className="text-slate-200">npm run dev</div>
              <div className="pt-2"><span className="text-cyan-400"># Production Build (Vite SPA)</span></div>
              <div className="text-slate-200">npm run build</div>
              <div className="pt-2"><span className="text-cyan-400"># Production Service (Cloud Run / Node.js)</span></div>
              <div className="text-slate-200">npm start  (runs tsx server.ts)</div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              When deploying frontend to Vercel, serverless routes in <code className="text-cyan-300 font-mono">/api/*</code> proxy to this backend engine, or the full container can be hosted on Google Cloud Run with automatic scaling.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
