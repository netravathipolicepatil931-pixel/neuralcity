import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { db } from './src/server/db.ts';
import { TrafficPredictionService } from './src/server/trafficService.ts';
import { FloodPredictionService } from './src/server/floodService.ts';
import { RoutingService } from './src/server/routingService.ts';
import { SimulationService } from './src/server/simulationService.ts';
import { InfraService } from './src/server/infraService.ts';
import {
  TrafficPredictionRequest,
  FloodPredictionRequest,
  EmergencyRouteRequest,
  WhatIfSimulationRequest,
  CityOverviewData,
} from './src/types/index.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

// Middleware
app.use(express.json());

// Enable CORS for API requests
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Request logger for API calls
app.use('/api', (req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

/* ============================================================
 * API ROUTES
 * ============================================================ */

// 1. Health check & verification
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'Neural City Digital Twin Backend Engine',
    version: '2.4.0-BengaluruTwin',
    database: {
      status: 'CONNECTED',
      engine: 'Persistent Local JSON/SQLite Store',
      locationsCount: db.getLocations().length,
      roadsCount: db.getRoads().length,
      alertsCount: db.getAlerts().length,
    },
    uptimeSeconds: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// 2. City Overview Dashboard Data
app.get('/api/dashboard', (req, res) => {
  try {
    const locations = db.getLocations();
    const roads = db.getRoads();
    const alerts = db.getAlerts();

    // Compute live city metrics
    const openRoads = roads.filter((r) => !r.isClosed);
    const avgCongestion = openRoads.length > 0
      ? Math.round(openRoads.reduce((sum, r) => sum + r.currentCongestion, 0) / openRoads.length)
      : 85;

    const criticalAlerts = alerts.filter((a) => a.severity === 'CRITICAL' && !a.acknowledged);
    const warningAlerts = alerts.filter((a) => a.severity === 'WARNING' && !a.acknowledged);

    // City Health Score: 100 base minus penalties
    let healthScore = 88;
    healthScore -= criticalAlerts.length * 6;
    healthScore -= warningAlerts.length * 2.5;
    if (avgCongestion > 75) healthScore -= (avgCongestion - 75) * 0.4;
    healthScore = Math.max(Math.min(Math.round(healthScore * 10) / 10, 100), 15);

    let cityHealthStatus: CityOverviewData['cityHealthStatus'] = 'Healthy';
    if (healthScore < 50) cityHealthStatus = 'Critical Failure';
    else if (healthScore < 70) cityHealthStatus = 'High Alert';
    else if (healthScore < 82) cityHealthStatus = 'Moderate Stress';

    // Traffic congestion label
    let trafficCongestionLabel = 'Optimal Flow';
    if (avgCongestion > 80) trafficCongestionLabel = 'Severe Gridlock';
    else if (avgCongestion > 65) trafficCongestionLabel = 'Heavy Congestion';
    else if (avgCongestion > 50) trafficCongestionLabel = 'Moderate Traffic';

    // Overall flood risk
    const floodRiskLevel = criticalAlerts.some((a) => a.category === 'FLOOD')
      ? 'CRITICAL'
      : (warningAlerts.some((a) => a.category === 'FLOOD') ? 'HIGH' : 'MODERATE');

    // Water & Electricity statuses
    const waterStatus = alerts.some((a) => a.category === 'WATER' && !a.acknowledged && a.severity === 'CRITICAL')
      ? 'Critical'
      : (alerts.some((a) => a.category === 'WATER' && !a.acknowledged) ? 'Warning' : 'Optimal');

    const powerStatus = alerts.some((a) => a.category === 'POWER' && !a.acknowledged && a.severity === 'CRITICAL')
      ? 'Critical'
      : (alerts.some((a) => a.category === 'POWER' && !a.acknowledged) ? 'Warning' : 'Optimal');

    // Hourly traffic trend
    const trafficTrendHourly = [
      { hour: '06:00', avgCongestion: 38, avgSpeed: 46 },
      { hour: '08:00', avgCongestion: 76, avgSpeed: 21 },
      { hour: '10:00', avgCongestion: 84, avgSpeed: 17 },
      { hour: '12:00', avgCongestion: 62, avgSpeed: 30 },
      { hour: '14:00', avgCongestion: 58, avgSpeed: 32 },
      { hour: '16:00', avgCongestion: 72, avgSpeed: 24 },
      { hour: '18:00', avgCongestion: 89, avgSpeed: 13 },
      { hour: '20:00', avgCongestion: 81, avgSpeed: 18 },
      { hour: '22:00', avgCongestion: 49, avgSpeed: 39 },
    ];

    // Infrastructure Health Breakdown
    const infrastructureHealthPoints = [
      { metric: 'Road Network Accessibility', score: Math.round((openRoads.length / roads.length) * 100), status: 'Good' },
      { metric: 'Water Distribution Pressure', score: 82, status: 'Stable' },
      { metric: 'Grid Transformer Thermal Margin', score: 74, status: 'Guarded' },
      { metric: 'Stormwater Drainage Capacity', score: 68, status: 'Stressed' },
      { metric: 'Emergency Dispatch Efficiency', score: 91, status: 'Optimal' },
    ];

    // Flood Vulnerability Rankings
    const floodVulnerabilityRankings = [
      { locationName: 'Silk Board', riskScore: 88, level: 'CRITICAL' },
      { locationName: 'KR Market', riskScore: 82, level: 'CRITICAL' },
      { locationName: 'Koramangala', riskScore: 78, level: 'HIGH' },
      { locationName: 'Hebbal Underpass', riskScore: 72, level: 'HIGH' },
      { locationName: 'Indiranagar', riskScore: 54, level: 'MODERATE' },
      { locationName: 'Whitefield', riskScore: 48, level: 'MODERATE' },
      { locationName: 'Majestic', riskScore: 45, level: 'MODERATE' },
      { locationName: 'MG Road', riskScore: 28, level: 'LOW' },
      { locationName: 'Yelahanka', riskScore: 22, level: 'LOW' },
    ];

    const totalKm = Math.round(roads.reduce((sum, r) => sum + r.distanceKm, 0) * 10) / 10;

    const data: CityOverviewData = {
      cityHealthScore: healthScore,
      cityHealthStatus,
      monitoredLocationsCount: locations.length,
      totalNetworkKm: totalKm,
      trafficCongestionIndex: avgCongestion,
      trafficCongestionLabel,
      floodRiskLevel,
      waterInfrastructureStatus: waterStatus,
      electricityInfrastructureStatus: powerStatus,
      activeCriticalAlertsCount: criticalAlerts.length,
      activeWarningAlertsCount: warningAlerts.length,
      totalActiveAlerts: criticalAlerts.length + warningAlerts.length,
      recentAlerts: alerts.slice(0, 5),
      trafficTrendHourly,
      infrastructureHealthPoints,
      floodVulnerabilityRankings,
      cityConditionSummary: `Bengaluru command telemetry indicates ${criticalAlerts.length} critical and ${warningAlerts.length} warning incidents. Average traffic index is at ${avgCongestion}% with major bottlenecks at Silk Board and KR Market. Low-lying catchment basins are on active stormwater alert.`,
    };

    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to generate dashboard overview', message: err.message });
  }
});

// 3. Locations
app.get('/api/locations', (req, res) => {
  res.json(db.getLocations());
});

app.get('/api/locations/:id', (req, res) => {
  const loc = db.getLocationById(req.params.id);
  if (!loc) return res.status(404).json({ error: 'Location not found' });
  res.json(loc);
});

// 4. Roads & Road Network
app.get('/api/roads', (req, res) => {
  res.json(db.getRoads());
});

app.post('/api/roads/:id/toggle-closure', (req, res) => {
  const { isClosed, reason } = req.body;
  const road = db.toggleRoadClosure(req.params.id, Boolean(isClosed), reason);
  if (!road) return res.status(404).json({ error: 'Road not found' });
  res.json({ success: true, road });
});

// 5. AI Traffic Prediction
app.post('/api/traffic/predict', (req, res) => {
  try {
    const { locationId, trafficVolumePcu, rainfallMmHr, isPeakHour, horizonHours } = req.body;

    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' });
    }

    const request: TrafficPredictionRequest = {
      locationId,
      trafficVolumePcu: Number(trafficVolumePcu) || 2000,
      rainfallMmHr: Number(rainfallMmHr) || 0,
      isPeakHour: Boolean(isPeakHour),
      horizonHours: (Number(horizonHours) || 2) as 1 | 2 | 4 | 6 | 12,
    };

    const result = TrafficPredictionService.predict(request);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Traffic prediction failed', message: err.message });
  }
});

// 6. AI Flood Prediction
app.post('/api/flood/predict', (req, res) => {
  try {
    const { locationId, rainfallMmHr, drainageCapacityPercent, soilSaturationPercent, elevationMeters } = req.body;

    if (!locationId) {
      return res.status(400).json({ error: 'locationId is required' });
    }

    const request: FloodPredictionRequest = {
      locationId,
      rainfallMmHr: Number(rainfallMmHr) ?? 25,
      drainageCapacityPercent: Number(drainageCapacityPercent) ?? 70,
      soilSaturationPercent: Number(soilSaturationPercent) ?? 60,
      elevationMeters: elevationMeters !== undefined ? Number(elevationMeters) : undefined,
    };

    const result = FloodPredictionService.predict(request);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Flood prediction failed', message: err.message });
  }
});

// 7. Infrastructure Telemetry
app.get('/api/infrastructure/water', (req, res) => {
  try {
    const telemetry = InfraService.getWaterTelemetry();
    res.json({
      type: 'WATER',
      isSimulated: true,
      timestamp: new Date().toISOString(),
      sensors: telemetry,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch water telemetry', message: err.message });
  }
});

app.get('/api/infrastructure/electricity', (req, res) => {
  try {
    const telemetry = InfraService.getElectricityTelemetry();
    res.json({
      type: 'ELECTRICITY',
      isSimulated: true,
      timestamp: new Date().toISOString(),
      sensors: telemetry,
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch electricity telemetry', message: err.message });
  }
});

// 8. Emergency Route Optimization (Dijkstra)
app.post('/api/emergency/route', (req, res) => {
  try {
    const {
      vehicleType,
      originId,
      destinationId,
      avoidClosedRoads,
      considerTraffic,
      considerFlood,
      customClosedRoadIds,
    } = req.body;

    if (!originId || !destinationId) {
      return res.status(400).json({ error: 'Both originId and destinationId are required' });
    }

    const request: EmergencyRouteRequest = {
      vehicleType: vehicleType || 'Ambulance',
      originId,
      destinationId,
      avoidClosedRoads: avoidClosedRoads !== undefined ? Boolean(avoidClosedRoads) : true,
      considerTraffic: considerTraffic !== undefined ? Boolean(considerTraffic) : true,
      considerFlood: considerFlood !== undefined ? Boolean(considerFlood) : true,
      customClosedRoadIds: Array.isArray(customClosedRoadIds) ? customClosedRoadIds : [],
    };

    const result = RoutingService.calculateRoute(request);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Emergency routing calculation failed', message: err.message });
  }
});

// 9. Connected What-If Simulation
app.post('/api/simulation/execute', (req, res) => {
  try {
    const {
      rainfallMmHr,
      drainageCapacityPercent,
      trafficVolumeMultiplier,
      waterDemandMultiplier,
      electricityDemandMultiplier,
      roadClosures,
      emergencyOriginId,
      emergencyDestinationId,
    } = req.body;

    const request: WhatIfSimulationRequest = {
      rainfallMmHr: Number(rainfallMmHr) || 50,
      drainageCapacityPercent: Number(drainageCapacityPercent) || 60,
      trafficVolumeMultiplier: Number(trafficVolumeMultiplier) || 1.3,
      waterDemandMultiplier: Number(waterDemandMultiplier) || 1.2,
      electricityDemandMultiplier: Number(electricityDemandMultiplier) || 1.2,
      roadClosures: Array.isArray(roadClosures) ? roadClosures : [],
      emergencyOriginId,
      emergencyDestinationId,
    };

    const result = SimulationService.executeScenario(request);
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'Scenario simulation failed', message: err.message });
  }
});

app.get('/api/simulation/history', (req, res) => {
  res.json(db.getSimulationHistory());
});

// 10. Alerts & Incidents
app.get('/api/alerts', (req, res) => {
  try {
    let alerts = db.getAlerts();
    const { category, severity, acknowledged, search, locationId } = req.query;

    if (category && category !== 'ALL') {
      alerts = alerts.filter((a) => a.category === category);
    }
    if (severity && severity !== 'ALL') {
      alerts = alerts.filter((a) => a.severity === severity);
    }
    if (acknowledged !== undefined && acknowledged !== 'ALL') {
      const isAck = acknowledged === 'true';
      alerts = alerts.filter((a) => a.acknowledged === isAck);
    }
    if (locationId) {
      alerts = alerts.filter((a) => a.locationId === locationId);
    }
    if (search && typeof search === 'string') {
      const q = search.toLowerCase();
      alerts = alerts.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q) ||
          a.locationName.toLowerCase().includes(q)
      );
    }

    res.json(alerts);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch alerts', message: err.message });
  }
});

app.post('/api/alerts/:id/acknowledge', (req, res) => {
  const { operatorName } = req.body;
  const updated = db.acknowledgeAlert(req.params.id, operatorName || 'Command Center Operator');
  if (!updated) {
    return res.status(404).json({ error: 'Alert not found' });
  }
  res.json({ success: true, alert: updated });
});

app.post('/api/alerts', (req, res) => {
  const { title, category, severity, locationId, locationName, description, suggestedAction, telemetrySnapshot } = req.body;
  if (!title || !category || !severity || !locationId) {
    return res.status(400).json({ error: 'Missing required alert fields' });
  }
  const alert = db.addAlert({
    title,
    category,
    severity,
    locationId,
    locationName: locationName || 'Bengaluru Urban Sector',
    description: description || 'Operator flagged anomaly',
    suggestedAction: suggestedAction || 'Monitor sector sensors',
    telemetrySnapshot,
  });
  res.json({ success: true, alert });
});

// Reset data
app.post('/api/reset-data', (req, res) => {
  const data = db.resetToDefaults();
  res.json({ success: true, message: 'Database reset to default Bengaluru baseline', data });
});

/* ============================================================
 * VITE MIDDLEWARE INTEGRATION (DEV) / STATIC SERVE (PROD)
 * ============================================================ */
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Neural City Engine] Running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('[Neural City Engine] Server launch error:', err);
  process.exit(1);
});
