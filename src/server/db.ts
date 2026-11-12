import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  LocationNode,
  RoadLink,
  WaterSensorReading,
  ElectricitySensorReading,
  AlertIncident,
  SimulationResult,
} from '../types/index.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.resolve(DATA_DIR, 'neural_city_db.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// 9 Official Bengaluru Monitored Locations with accurate geospatial coordinates and physical attributes
const INITIAL_LOCATIONS: LocationNode[] = [
  {
    id: 'LOC_HEBBAL',
    name: 'Hebbal',
    shortName: 'HBL',
    lat: 13.0358,
    lng: 77.5970,
    elevation: 905,
    zone: 'Bengaluru North',
    wardNumber: 20,
    population: 185000,
    description: 'Crucial northern flyover interchange connecting NH44 Airport Expressway and Outer Ring Road; susceptible to severe waterlogging at the grade-separated underpass during torrential monsoons.',
    riskProfile: 'high',
    baselineCongestion: 74,
    baselineFloodRisk: 'HIGH',
    baselineWaterPressure: 3.4,
    baselinePowerLoad: 42.5,
  },
  {
    id: 'LOC_YELAHANKA',
    name: 'Yelahanka',
    shortName: 'YLH',
    lat: 13.1007,
    lng: 77.5963,
    elevation: 918,
    zone: 'Bengaluru North Suburbs',
    wardNumber: 4,
    population: 215000,
    description: 'Northern aerospace and residential node with dual water-reservoir intake lines and defense airbase installations; elevated topography providing moderate natural storm drainage.',
    riskProfile: 'low',
    baselineCongestion: 42,
    baselineFloodRisk: 'LOW',
    baselineWaterPressure: 4.1,
    baselinePowerLoad: 31.0,
  },
  {
    id: 'LOC_MAJESTIC',
    name: 'Majestic',
    shortName: 'MAJ',
    lat: 12.9767,
    lng: 77.5713,
    elevation: 910,
    zone: 'Bengaluru Central Transit Hub',
    wardNumber: 94,
    population: 320000,
    description: 'Epicenter of Bengaluru transit including KSR Railway Station and Kempegowda Bus Interchange; extreme commuter surge load, high electricity grid draw, and dense underground utilities.',
    riskProfile: 'high',
    baselineCongestion: 82,
    baselineFloodRisk: 'MODERATE',
    baselineWaterPressure: 3.1,
    baselinePowerLoad: 58.2,
  },
  {
    id: 'LOC_MGROAD',
    name: 'MG Road',
    shortName: 'MGR',
    lat: 12.9756,
    lng: 77.6097,
    elevation: 924,
    zone: 'Central Business District (CBD)',
    wardNumber: 111,
    population: 140000,
    description: 'Flagship commercial, banking, and retail boulevard. High electrical transformer redundancy, high baseline traffic flow with active synchronized smart signaling.',
    riskProfile: 'low',
    baselineCongestion: 61,
    baselineFloodRisk: 'LOW',
    baselineWaterPressure: 3.8,
    baselinePowerLoad: 49.0,
  },
  {
    id: 'LOC_INDIRANAGAR',
    name: 'Indiranagar',
    shortName: 'IND',
    lat: 12.9784,
    lng: 77.6408,
    elevation: 902,
    zone: 'Bengaluru East',
    wardNumber: 112,
    population: 175000,
    description: 'High-density commercial 100-Ft road and residential grid; moderate localized stormwater runoff during heavy downpours with critical commercial power distribution.',
    riskProfile: 'moderate',
    baselineCongestion: 68,
    baselineFloodRisk: 'MODERATE',
    baselineWaterPressure: 3.5,
    baselinePowerLoad: 38.6,
  },
  {
    id: 'LOC_KRMARKET',
    name: 'KR Market',
    shortName: 'KRM',
    lat: 12.9634,
    lng: 77.5779,
    elevation: 895,
    zone: 'Old Bengaluru Heritage / South-Central',
    wardNumber: 139,
    population: 290000,
    description: 'Historic wholesale floral and agricultural market lying in a natural topographic basin with aged legacy storm drains; highly vulnerable to flash flood inundation.',
    riskProfile: 'critical',
    baselineCongestion: 86,
    baselineFloodRisk: 'CRITICAL',
    baselineWaterPressure: 2.7,
    baselinePowerLoad: 44.0,
  },
  {
    id: 'LOC_KORAMANGALA',
    name: 'Koramangala',
    shortName: 'KOR',
    lat: 12.9352,
    lng: 77.6245,
    elevation: 890,
    zone: 'Bengaluru South-East',
    wardNumber: 151,
    population: 230000,
    description: 'Premier startup and tech residential hub situated immediately upstream of the Bellandur lake catchment basin; historical primary storm water canal overflow zone.',
    riskProfile: 'critical',
    baselineCongestion: 79,
    baselineFloodRisk: 'CRITICAL',
    baselineWaterPressure: 3.2,
    baselinePowerLoad: 52.4,
  },
  {
    id: 'LOC_SILKBOARD',
    name: 'Silk Board',
    shortName: 'SLK',
    lat: 12.9177,
    lng: 77.6238,
    elevation: 885,
    zone: 'Bengaluru South',
    wardNumber: 174,
    population: 260000,
    description: 'Critical nexus connecting Hosur Road, BTM Layout, and Outer Ring Road; lowest topological elevation (885m) causing severe storm runoff pooling and chronic traffic chokepoints.',
    riskProfile: 'critical',
    baselineCongestion: 91,
    baselineFloodRisk: 'CRITICAL',
    baselineWaterPressure: 2.9,
    baselinePowerLoad: 56.8,
  },
  {
    id: 'LOC_WHITEFIELD',
    name: 'Whitefield',
    shortName: 'WTF',
    lat: 12.9698,
    lng: 77.7499,
    elevation: 912,
    zone: 'Eastern Tech Corridor (EPIP/ITPB)',
    wardNumber: 84,
    population: 340000,
    description: 'Massive IT and multinational tech park cluster. High industrial and substation electrical load, heavy commercial freight, and long arterial connections.',
    riskProfile: 'moderate',
    baselineCongestion: 72,
    baselineFloodRisk: 'MODERATE',
    baselineWaterPressure: 3.3,
    baselinePowerLoad: 76.5,
  },
];

// Connected Bengaluru Road Network connecting the 9 nodes
const INITIAL_ROADS: RoadLink[] = [
  {
    id: 'ROAD_1',
    name: 'Bellary Road Expressway (NH 44)',
    fromNodeId: 'LOC_HEBBAL',
    toNodeId: 'LOC_YELAHANKA',
    distanceKm: 8.5,
    lanes: 6,
    speedLimitKmh: 80,
    baselineCongestion: 45,
    currentCongestion: 48,
    currentSpeedKmh: 62,
    isClosed: false,
    floodSusceptibility: 'low',
    waterAccumulationCm: 3,
    status: 'optimal',
  },
  {
    id: 'ROAD_2',
    name: 'Palace Cross / Bellary Corridor',
    fromNodeId: 'LOC_HEBBAL',
    toNodeId: 'LOC_MAJESTIC',
    distanceKm: 7.2,
    lanes: 4,
    speedLimitKmh: 50,
    baselineCongestion: 76,
    currentCongestion: 78,
    currentSpeedKmh: 22,
    isClosed: false,
    floodSusceptibility: 'high',
    waterAccumulationCm: 14,
    status: 'congested',
  },
  {
    id: 'ROAD_3',
    name: 'Sheshadri / Kasturba Link Road',
    fromNodeId: 'LOC_MAJESTIC',
    toNodeId: 'LOC_MGROAD',
    distanceKm: 4.2,
    lanes: 4,
    speedLimitKmh: 50,
    baselineCongestion: 65,
    currentCongestion: 63,
    currentSpeedKmh: 28,
    isClosed: false,
    floodSusceptibility: 'low',
    waterAccumulationCm: 2,
    status: 'optimal',
  },
  {
    id: 'ROAD_4',
    name: 'Old Madras Road (OMR)',
    fromNodeId: 'LOC_MGROAD',
    toNodeId: 'LOC_INDIRANAGAR',
    distanceKm: 4.8,
    lanes: 4,
    speedLimitKmh: 50,
    baselineCongestion: 62,
    currentCongestion: 60,
    currentSpeedKmh: 31,
    isClosed: false,
    floodSusceptibility: 'moderate',
    waterAccumulationCm: 8,
    status: 'optimal',
  },
  {
    id: 'ROAD_5',
    name: 'HAL Old Airport / Varthur Road',
    fromNodeId: 'LOC_INDIRANAGAR',
    toNodeId: 'LOC_WHITEFIELD',
    distanceKm: 14.5,
    lanes: 4,
    speedLimitKmh: 60,
    baselineCongestion: 70,
    currentCongestion: 73,
    currentSpeedKmh: 25,
    isClosed: false,
    floodSusceptibility: 'moderate',
    waterAccumulationCm: 11,
    status: 'congested',
  },
  {
    id: 'ROAD_6',
    name: 'Avenue Road / BKM Arterial',
    fromNodeId: 'LOC_MAJESTIC',
    toNodeId: 'LOC_KRMARKET',
    distanceKm: 2.5,
    lanes: 4,
    speedLimitKmh: 40,
    baselineCongestion: 85,
    currentCongestion: 89,
    currentSpeedKmh: 14,
    isClosed: false,
    floodSusceptibility: 'high',
    waterAccumulationCm: 19,
    status: 'congested',
  },
  {
    id: 'ROAD_7',
    name: 'Hosur Road / Dairy Circle Cut',
    fromNodeId: 'LOC_KRMARKET',
    toNodeId: 'LOC_KORAMANGALA',
    distanceKm: 6.1,
    lanes: 4,
    speedLimitKmh: 50,
    baselineCongestion: 78,
    currentCongestion: 81,
    currentSpeedKmh: 19,
    isClosed: false,
    floodSusceptibility: 'high',
    waterAccumulationCm: 22,
    status: 'congested',
  },
  {
    id: 'ROAD_8',
    name: 'Hosur Road Expressway (Silk Board Link)',
    fromNodeId: 'LOC_KORAMANGALA',
    toNodeId: 'LOC_SILKBOARD',
    distanceKm: 3.2,
    lanes: 6,
    speedLimitKmh: 60,
    baselineCongestion: 89,
    currentCongestion: 92,
    currentSpeedKmh: 12,
    isClosed: false,
    floodSusceptibility: 'critical',
    waterAccumulationCm: 28,
    status: 'congested',
  },
  {
    id: 'ROAD_9',
    name: 'Outer Ring Road (Silk Board to Marathahalli)',
    fromNodeId: 'LOC_SILKBOARD',
    toNodeId: 'LOC_WHITEFIELD',
    distanceKm: 16.8,
    lanes: 6,
    speedLimitKmh: 70,
    baselineCongestion: 77,
    currentCongestion: 79,
    currentSpeedKmh: 24,
    isClosed: false,
    floodSusceptibility: 'moderate',
    waterAccumulationCm: 10,
    status: 'congested',
  },
  {
    id: 'ROAD_10',
    name: 'Outer Ring Road North (Hebbal to Hennur/East)',
    fromNodeId: 'LOC_HEBBAL',
    toNodeId: 'LOC_INDIRANAGAR',
    distanceKm: 11.2,
    lanes: 6,
    speedLimitKmh: 70,
    baselineCongestion: 66,
    currentCongestion: 64,
    currentSpeedKmh: 35,
    isClosed: false,
    floodSusceptibility: 'moderate',
    waterAccumulationCm: 6,
    status: 'optimal',
  },
  {
    id: 'ROAD_11',
    name: 'Inner Ring Road (Domlur to Koramangala)',
    fromNodeId: 'LOC_MGROAD',
    toNodeId: 'LOC_KORAMANGALA',
    distanceKm: 5.5,
    lanes: 4,
    speedLimitKmh: 50,
    baselineCongestion: 72,
    currentCongestion: 74,
    currentSpeedKmh: 24,
    isClosed: false,
    floodSusceptibility: 'moderate',
    waterAccumulationCm: 9,
    status: 'congested',
  },
  {
    id: 'ROAD_12',
    name: 'Wilson Garden / Bannerghatta Cut',
    fromNodeId: 'LOC_KRMARKET',
    toNodeId: 'LOC_SILKBOARD',
    distanceKm: 6.8,
    lanes: 4,
    speedLimitKmh: 50,
    baselineCongestion: 80,
    currentCongestion: 83,
    currentSpeedKmh: 18,
    isClosed: false,
    floodSusceptibility: 'high',
    waterAccumulationCm: 18,
    status: 'congested',
  },
];

// Seeded Alerts
const INITIAL_ALERTS: AlertIncident[] = [
  {
    id: 'ALT_001',
    title: 'Severe Stormwater Pooling at Silk Board Junction',
    category: 'FLOOD',
    severity: 'CRITICAL',
    locationId: 'LOC_SILKBOARD',
    locationName: 'Silk Board',
    description: 'Depression basin elevation 885m accumulated 28cm of runoff water after sudden rainfall intensity exceeded 42mm/hr. Low-clearance transit affected.',
    timestamp: new Date(Date.now() - 14 * 60 * 1000).toISOString(),
    acknowledged: false,
    suggestedAction: 'Deploy high-capacity dewatering pumps (Station 4) and dispatch traffic wardens for flyover diversions.',
    telemetrySnapshot: { waterLevelCm: 28, rainfallMmHr: 42, trafficIndex: 92 },
  },
  {
    id: 'ALT_002',
    title: 'Substation Transformer Overheating at Majestic Central Hub',
    category: 'POWER',
    severity: 'CRITICAL',
    locationId: 'LOC_MAJESTIC',
    locationName: 'Majestic',
    description: 'Main Distribution Substation 66/11kV Transformer #2 core temperature reached 79.4°C under 94% peak commuter and metro traction load.',
    timestamp: new Date(Date.now() - 28 * 60 * 1000).toISOString(),
    acknowledged: false,
    suggestedAction: 'Engage secondary liquid-cooling bank and shed non-essential commercial auxiliary feeder lines.',
    telemetrySnapshot: { transformerTempC: 79.4, loadPercent: 94, voltageV: 218 },
  },
  {
    id: 'ALT_003',
    title: 'Water Main Line Pressure Drop at KR Market Sector 3',
    category: 'WATER',
    severity: 'WARNING',
    locationId: 'LOC_KRMARKET',
    locationName: 'KR Market',
    description: 'Pipeline pressure decreased to 2.1 bar (normal range: 2.8 - 4.2 bar). Flow rate increased by 26% indicating potential joint rupture in heritage line.',
    timestamp: new Date(Date.now() - 52 * 60 * 1000).toISOString(),
    acknowledged: false,
    suggestedAction: 'Isolate Sector 3 hydraulic gate valve and dispatch acoustic leak detection crew.',
    telemetrySnapshot: { pipelinePressureBar: 2.1, flowRateKlHr: 340, normalPressureBar: 3.2 },
  },
  {
    id: 'ALT_004',
    title: 'Gridlock Warning: Koramangala 80-Ft Road to Silk Board',
    category: 'TRAFFIC',
    severity: 'WARNING',
    locationId: 'LOC_KORAMANGALA',
    locationName: 'Koramangala',
    description: 'Vehicle average speed dropped to 12 km/h with congestion index sustained at 92% over the last 40 minutes.',
    timestamp: new Date(Date.now() - 75 * 60 * 1000).toISOString(),
    acknowledged: true,
    acknowledgedBy: 'Operator BBMP-North-Control',
    acknowledgedAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    suggestedAction: 'Adjust adaptive signal green-wave on Sarjapur link road.',
    telemetrySnapshot: { speedKmh: 12, congestionPercent: 92 },
  },
  {
    id: 'ALT_005',
    title: 'Hebbal Flyover Inbound Airport Corridor Heavy Traffic',
    category: 'TRAFFIC',
    severity: 'INFO',
    locationId: 'LOC_HEBBAL',
    locationName: 'Hebbal',
    description: 'Moderate delay reported heading towards City Center from Yelahanka due to lane reduction work near railway bridge.',
    timestamp: new Date(Date.now() - 110 * 60 * 1000).toISOString(),
    acknowledged: true,
    acknowledgedBy: 'Automated Sensor Watchdog',
    acknowledgedAt: new Date(Date.now() - 80 * 60 * 1000).toISOString(),
    suggestedAction: 'Display alternate route notice on Dynamic Variable Message Signs.',
    telemetrySnapshot: { speedKmh: 35, congestionPercent: 68 },
  },
];

// In-Memory Database Structure with JSON File Sync
interface DatabaseSchema {
  locations: LocationNode[];
  roads: RoadLink[];
  alerts: AlertIncident[];
  simulationHistory: SimulationResult[];
  lastInitialized: string;
}

class NeuralCityDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadOrInitialize();
  }

  private loadOrInitialize(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        if (parsed.locations && parsed.roads && parsed.alerts) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Could not read existing db file, initializing seed dataset:', err);
    }

    const initial: DatabaseSchema = {
      locations: INITIAL_LOCATIONS,
      roads: INITIAL_ROADS,
      alerts: INITIAL_ALERTS,
      simulationHistory: [],
      lastInitialized: new Date().toISOString(),
    };
    this.save(initial);
    return initial;
  }

  private save(dataToSave?: DatabaseSchema) {
    try {
      const payload = dataToSave || this.data;
      fs.writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to write to neural_city_db.json:', err);
    }
  }

  public getLocations(): LocationNode[] {
    return this.data.locations;
  }

  public getLocationById(id: string): LocationNode | undefined {
    return this.data.locations.find((l) => l.id === id);
  }

  public getRoads(): RoadLink[] {
    return this.data.roads;
  }

  public getRoadById(id: string): RoadLink | undefined {
    return this.data.roads.find((r) => r.id === id);
  }

  public updateRoad(id: string, updates: Partial<RoadLink>): RoadLink | undefined {
    const road = this.data.roads.find((r) => r.id === id);
    if (road) {
      Object.assign(road, updates);
      this.save();
    }
    return road;
  }

  public toggleRoadClosure(id: string, isClosed: boolean, reason?: string): RoadLink | undefined {
    const road = this.data.roads.find((r) => r.id === id);
    if (road) {
      road.isClosed = isClosed;
      road.closureReason = isClosed ? (reason || 'Manual road closure by command operator') : undefined;
      road.status = isClosed ? 'closed' : (road.currentCongestion > 75 ? 'congested' : 'optimal');
      this.save();
    }
    return road;
  }

  public getAlerts(): AlertIncident[] {
    return this.data.alerts;
  }

  public acknowledgeAlert(id: string, operatorName: string = 'Command Center Operator'): AlertIncident | null {
    const alert = this.data.alerts.find((a) => a.id === id);
    if (alert) {
      alert.acknowledged = true;
      alert.acknowledgedBy = operatorName;
      alert.acknowledgedAt = new Date().toISOString();
      this.save();
      return alert;
    }
    return null;
  }

  public addAlert(alert: Omit<AlertIncident, 'id' | 'timestamp' | 'acknowledged'>): AlertIncident {
    const newAlert: AlertIncident = {
      ...alert,
      id: `ALT_${Date.now()}`,
      timestamp: new Date().toISOString(),
      acknowledged: false,
    };
    this.data.alerts.unshift(newAlert);
    this.save();
    return newAlert;
  }

  public saveSimulationResult(result: SimulationResult) {
    this.data.simulationHistory.unshift(result);
    if (this.data.simulationHistory.length > 20) {
      this.data.simulationHistory = this.data.simulationHistory.slice(0, 20);
    }
    this.save();
  }

  public getSimulationHistory(): SimulationResult[] {
    return this.data.simulationHistory;
  }

  public resetToDefaults() {
    this.data = {
      locations: JSON.parse(JSON.stringify(INITIAL_LOCATIONS)),
      roads: JSON.parse(JSON.stringify(INITIAL_ROADS)),
      alerts: JSON.parse(JSON.stringify(INITIAL_ALERTS)),
      simulationHistory: [],
      lastInitialized: new Date().toISOString(),
    };
    this.save();
    return this.data;
  }
}

export const db = new NeuralCityDatabase();
