import {
  LocationNode,
  RoadLink,
  TrafficPredictionRequest,
  TrafficPredictionResult,
  FloodPredictionRequest,
  FloodPredictionResult,
  EmergencyRouteRequest,
  EmergencyRouteResult,
  WhatIfSimulationRequest,
  SimulationResult,
  AlertIncident,
  CityOverviewData,
  WaterSensorReading,
  ElectricitySensorReading,
} from '../types/index.ts';

const BASE_URL = '/api';

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorBody = await res.json().catch(() => ({}));
    throw new Error(errorBody.message || errorBody.error || `Request failed with status ${res.status}`);
  }
  return res.json();
}

export const ApiService = {
  async getHealth(): Promise<{
    status: string;
    service: string;
    version: string;
    database: {
      status: string;
      engine: string;
      locationsCount: number;
      roadsCount: number;
      alertsCount: number;
    };
    uptimeSeconds: number;
    timestamp: string;
  }> {
    const res = await fetch(`${BASE_URL}/health`);
    return handleResponse(res);
  },

  async getDashboard(): Promise<CityOverviewData> {
    const res = await fetch(`${BASE_URL}/dashboard`);
    return handleResponse(res);
  },

  async getLocations(): Promise<LocationNode[]> {
    const res = await fetch(`${BASE_URL}/locations`);
    return handleResponse(res);
  },

  async getRoads(): Promise<RoadLink[]> {
    const res = await fetch(`${BASE_URL}/roads`);
    return handleResponse(res);
  },

  async toggleRoadClosure(roadId: string, isClosed: boolean, reason?: string): Promise<{ success: boolean; road: RoadLink }> {
    const res = await fetch(`${BASE_URL}/roads/${roadId}/toggle-closure`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isClosed, reason }),
    });
    return handleResponse(res);
  },

  async predictTraffic(params: TrafficPredictionRequest): Promise<TrafficPredictionResult> {
    const res = await fetch(`${BASE_URL}/traffic/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async predictFlood(params: FloodPredictionRequest): Promise<FloodPredictionResult> {
    const res = await fetch(`${BASE_URL}/flood/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getWaterTelemetry(): Promise<{
    type: string;
    isSimulated: boolean;
    timestamp: string;
    sensors: WaterSensorReading[];
  }> {
    const res = await fetch(`${BASE_URL}/infrastructure/water`);
    return handleResponse(res);
  },

  async getElectricityTelemetry(): Promise<{
    type: string;
    isSimulated: boolean;
    timestamp: string;
    sensors: ElectricitySensorReading[];
  }> {
    const res = await fetch(`${BASE_URL}/infrastructure/electricity`);
    return handleResponse(res);
  },

  async calculateEmergencyRoute(params: EmergencyRouteRequest): Promise<EmergencyRouteResult> {
    const res = await fetch(`${BASE_URL}/emergency/route`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async executeSimulation(params: WhatIfSimulationRequest): Promise<SimulationResult> {
    const res = await fetch(`${BASE_URL}/simulation/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return handleResponse(res);
  },

  async getSimulationHistory(): Promise<SimulationResult[]> {
    const res = await fetch(`${BASE_URL}/simulation/history`);
    return handleResponse(res);
  },

  async getAlerts(filters?: {
    category?: string;
    severity?: string;
    acknowledged?: string;
    search?: string;
    locationId?: string;
  }): Promise<AlertIncident[]> {
    const params = new URLSearchParams();
    if (filters?.category && filters.category !== 'ALL') params.set('category', filters.category);
    if (filters?.severity && filters.severity !== 'ALL') params.set('severity', filters.severity);
    if (filters?.acknowledged && filters.acknowledged !== 'ALL') params.set('acknowledged', filters.acknowledged);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.locationId) params.set('locationId', filters.locationId);

    const qs = params.toString();
    const res = await fetch(`${BASE_URL}/alerts${qs ? `?${qs}` : ''}`);
    return handleResponse(res);
  },

  async acknowledgeAlert(alertId: string, operatorName?: string): Promise<{ success: boolean; alert: AlertIncident }> {
    const res = await fetch(`${BASE_URL}/alerts/${alertId}/acknowledge`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operatorName }),
    });
    return handleResponse(res);
  },

  async createAlert(payload: {
    title: string;
    category: string;
    severity: string;
    locationId: string;
    locationName?: string;
    description: string;
    suggestedAction?: string;
  }): Promise<{ success: boolean; alert: AlertIncident }> {
    const res = await fetch(`${BASE_URL}/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleResponse(res);
  },

  async resetData(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(`${BASE_URL}/reset-data`, {
      method: 'POST',
    });
    return handleResponse(res);
  },
};
