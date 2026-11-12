/**
 * Core Domain Types for Neural City Digital Twin
 */

export interface LocationNode {
  id: string;
  name: string;
  shortName: string;
  lat: number;
  lng: number;
  elevation: number; // in meters
  zone: string;
  wardNumber: number;
  population: number;
  description: string;
  riskProfile: 'low' | 'moderate' | 'high' | 'critical';
  baselineCongestion: number; // 0 - 100%
  baselineFloodRisk: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  baselineWaterPressure: number; // bar
  baselinePowerLoad: number; // MVA
}

export interface RoadLink {
  id: string;
  name: string;
  fromNodeId: string;
  toNodeId: string;
  distanceKm: number;
  lanes: number;
  speedLimitKmh: number;
  baselineCongestion: number; // 0 - 100%
  currentCongestion: number; // 0 - 100%
  currentSpeedKmh: number;
  isClosed: boolean;
  closureReason?: string;
  floodSusceptibility: 'low' | 'moderate' | 'high' | 'critical';
  waterAccumulationCm: number;
  status: 'optimal' | 'congested' | 'waterlogged' | 'closed';
}

export interface TrafficPredictionRequest {
  locationId: string;
  trafficVolumePcu: number;
  rainfallMmHr: number;
  isPeakHour: boolean;
  horizonHours: 1 | 2 | 4 | 6 | 12;
}

export interface TrafficForecastPoint {
  hourOffset: number;
  timeLabel: string;
  congestionPercent: number;
  speedKmh: number;
  confidenceInterval: [number, number];
}

export interface TrafficPredictionResult {
  locationId: string;
  locationName: string;
  predictedCongestionPercent: number;
  predictedSpeedKmh: number;
  classification: 'Free Flow' | 'Moderate Congestion' | 'Heavy Congestion' | 'Gridlock Severe';
  forecastSequence: TrafficForecastPoint[];
  modelInfo: {
    algorithm: string;
    r2Score: number;
    rmse: number;
    trainingDataPoints: number;
    lastTrained: string;
  };
  contributingFactors: {
    baseVolumeImpact: number;
    rainfallImpact: number;
    peakHourImpact: number;
    corridorCapacityFactor: number;
  };
  predictionTimestamp: string;
}

export interface FloodPredictionRequest {
  locationId: string;
  rainfallMmHr: number;
  drainageCapacityPercent: number;
  soilSaturationPercent: number;
  elevationMeters?: number;
}

export interface FloodPredictionResult {
  locationId: string;
  locationName: string;
  classification: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  riskProbabilityPercent: number;
  estimatedWaterAccumulationCm: number;
  elevationMeters: number;
  contributingFactors: {
    rainfallFactor: number; // 0-100
    drainageDeficitFactor: number; // 0-100
    topographicDepressionFactor: number; // 0-100
    soilRunoffIndex: number; // 0-100
  };
  explanation: string;
  mitigationAdvice: string[];
  predictionTimestamp: string;
}

export interface WaterSensorReading {
  sensorId: string;
  locationId: string;
  locationName: string;
  pipelinePressureBar: number; // normal 2.5 - 4.5
  flowRateKlHr: number; // kL/hr
  reservoirLevelPercent: number; // %
  sensorStatus: 'Optimal' | 'Warning' | 'Critical';
  statusReason?: string;
  lastUpdated: string;
  history: Array<{
    timestamp: string;
    pressure: number;
    flowRate: number;
    reservoirLevel: number;
  }>;
}

export interface ElectricitySensorReading {
  sensorId: string;
  locationId: string;
  locationName: string;
  transformerTempC: number; // normal 40 - 65, warning 66-80, critical > 80
  voltageV: number; // normal 220 - 240
  powerLoadMva: number; // MVA
  sensorStatus: 'Optimal' | 'Warning' | 'Critical';
  statusReason?: string;
  lastUpdated: string;
  history: Array<{
    timestamp: string;
    temp: number;
    voltage: number;
    load: number;
  }>;
}

export interface EmergencyRouteRequest {
  vehicleType: 'Ambulance' | 'Fire Brigade' | 'Disaster Rescue';
  originId: string;
  destinationId: string;
  avoidClosedRoads: boolean;
  considerTraffic: boolean;
  considerFlood: boolean;
  customClosedRoadIds?: string[];
}

export interface RouteSegment {
  roadId: string;
  roadName: string;
  fromNodeId: string;
  fromNodeName: string;
  toNodeId: string;
  toNodeName: string;
  distanceKm: number;
  congestionPercent: number;
  speedKmh: number;
  waterLevelCm: number;
  travelTimeMin: number;
  isClosed: boolean;
}

export interface AvoidedRoad {
  roadId: string;
  roadName: string;
  fromNodeName: string;
  toNodeName: string;
  reason: string;
}

export interface EmergencyRouteResult {
  vehicleType: 'Ambulance' | 'Fire Brigade' | 'Disaster Rescue';
  origin: LocationNode;
  destination: LocationNode;
  routeNodeIds: string[];
  routeNodeNames: string[];
  routeSegments: RouteSegment[];
  totalDistanceKm: number;
  estimatedTravelTimeMin: number;
  avoidedRoads: AvoidedRoad[];
  navigationInstructions: string[];
  algorithmUsed: string;
  alternativeRouteAvailable: boolean;
  timestamp: string;
}

export interface WhatIfSimulationRequest {
  rainfallMmHr: number;
  drainageCapacityPercent: number;
  trafficVolumeMultiplier: number;
  waterDemandMultiplier: number;
  electricityDemandMultiplier: number;
  roadClosures: string[]; // road IDs
  emergencyOriginId?: string;
  emergencyDestinationId?: string;
}

export interface SimulationResult {
  scenarioId: string;
  inputs: WhatIfSimulationRequest;
  timestamp: string;
  baseline: {
    cityHealthScore: number;
    avgCongestionPercent: number;
    highRiskFloodNodesCount: number;
    stressedInfraNodesCount: number;
    openRoadsCount: number;
  };
  simulated: {
    cityHealthScore: number;
    avgCongestionPercent: number;
    highRiskFloodNodesCount: number;
    stressedInfraNodesCount: number;
    openRoadsCount: number;
    estimatedAtRiskPopulation: number;
  };
  nodeImpacts: Array<{
    locationId: string;
    locationName: string;
    floodClassification: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
    waterAccumulationCm: number;
    congestionPercent: number;
    waterPressureBar: number;
    transformerTempC: number;
    overallStatus: 'Normal' | 'Warning' | 'Critical';
    affectedPopulation: number;
  }>;
  roadImpacts: Array<{
    roadId: string;
    name: string;
    isPassable: boolean;
    congestionPercent: number;
    waterAccumulationCm: number;
    status: 'optimal' | 'congested' | 'waterlogged' | 'closed';
    closureReason?: string;
  }>;
  infrastructureStress: {
    waterStressScore: number; // 0-100
    powerGridStressScore: number; // 0-100
    drainageSurplusDeficit: number; // percentage
    highTempTransformers: string[];
    lowPressureWaterZones: string[];
  };
  emergencyRerouting: {
    originName: string;
    destinationName: string;
    baselineTimeMin: number;
    simulatedTimeMin: number;
    timeDeltaPercent: number;
    routeAltered: boolean;
    divertedRoads: string[];
  };
  cascadingChainSummary: string[];
}

export interface AlertIncident {
  id: string;
  title: string;
  category: 'TRAFFIC' | 'FLOOD' | 'WATER' | 'POWER' | 'EMERGENCY';
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  locationId: string;
  locationName: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: string;
  suggestedAction: string;
  telemetrySnapshot?: Record<string, any>;
}

export interface CityOverviewData {
  cityHealthScore: number;
  cityHealthStatus: 'Healthy' | 'Moderate Stress' | 'High Alert' | 'Critical Failure';
  monitoredLocationsCount: number;
  totalNetworkKm: number;
  trafficCongestionIndex: number;
  trafficCongestionLabel: string;
  floodRiskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  waterInfrastructureStatus: 'Optimal' | 'Warning' | 'Critical';
  electricityInfrastructureStatus: 'Optimal' | 'Warning' | 'Critical';
  activeCriticalAlertsCount: number;
  activeWarningAlertsCount: number;
  totalActiveAlerts: number;
  recentAlerts: AlertIncident[];
  trafficTrendHourly: Array<{ hour: string; avgCongestion: number; avgSpeed: number }>;
  infrastructureHealthPoints: Array<{ metric: string; score: number; status: string }>;
  floodVulnerabilityRankings: Array<{ locationName: string; riskScore: number; level: string }>;
  cityConditionSummary: string;
}
