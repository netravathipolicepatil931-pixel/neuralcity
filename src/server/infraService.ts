import { db } from './db.ts';
import { WaterSensorReading, ElectricitySensorReading } from '../types/index.ts';

export class InfraService {
  /**
   * Generates realistic 24-hour telemetry for all 9 Bengaluru locations
   */
  public static getWaterTelemetry(): WaterSensorReading[] {
    const locations = db.getLocations();
    const now = Date.now();

    return locations.map((loc) => {
      let pressure = loc.baselineWaterPressure;
      let flowRate = Math.round(180 + loc.population / 1200);
      let reservoir = Math.round(72 + Math.sin(loc.lat * 10) * 15);
      let status: 'Optimal' | 'Warning' | 'Critical' = 'Optimal';
      let statusReason = 'Hydraulic parameters within nominal threshold envelope (2.5 - 4.5 bar).';

      // Location specific anomalies for demonstration
      if (loc.id === 'LOC_KRMARKET') {
        pressure = 2.1;
        flowRate = 340;
        status = 'Warning';
        statusReason = 'Pressure drop detected (2.1 bar < min 2.5 bar threshold); anomalous 26% flow surge indicates joint leakage.';
      } else if (loc.id === 'LOC_SILKBOARD') {
        pressure = 2.4;
        status = 'Warning';
        statusReason = 'Backpressure from inundated storm canals impacting discharge flow.';
      }

      // Generate 24 hourly historical readings
      const history = [];
      for (let i = 23; i >= 0; i--) {
        const timePoint = new Date(now - i * 3600 * 1000);
        const timeLabel = timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        // diurnal diurnal diurnal pattern
        const hour = timePoint.getHours();
        const diurnalDemand = (hour >= 6 && hour <= 10) || (hour >= 18 && hour <= 21) ? 0.8 : 1.1;
        const noise = (Math.sin(i * 1.5 + loc.elevation) * 0.15);

        history.push({
          timestamp: timeLabel,
          pressure: Math.round((pressure * diurnalDemand + noise) * 10) / 10,
          flowRate: Math.round(flowRate / diurnalDemand + noise * 20),
          reservoirLevel: Math.round(Math.min(Math.max(reservoir - (i * 0.4) + Math.cos(i) * 3, 30), 98)),
        });
      }

      return {
        sensorId: `WTR_SNS_${loc.shortName}`,
        locationId: loc.id,
        locationName: loc.name,
        pipelinePressureBar: pressure,
        flowRateKlHr: flowRate,
        reservoirLevelPercent: reservoir,
        sensorStatus: status,
        statusReason,
        lastUpdated: new Date().toISOString(),
        history,
      };
    });
  }

  public static getElectricityTelemetry(): ElectricitySensorReading[] {
    const locations = db.getLocations();
    const now = Date.now();

    return locations.map((loc) => {
      let temp = 52 + Math.round((loc.baselinePowerLoad / 3.5) * 10) / 10;
      let voltage = 230 + Math.round((Math.sin(loc.lng) * 4) * 10) / 10;
      let load = loc.baselinePowerLoad;
      let status: 'Optimal' | 'Warning' | 'Critical' = 'Optimal';
      let statusReason = 'Substation transformer thermal and voltage profiles operating within IEEE C57.91 standards.';

      // Location specific anomalies
      if (loc.id === 'LOC_MAJESTIC') {
        temp = 79.4;
        voltage = 218;
        load = 62.4;
        status = 'Critical';
        statusReason = 'Critical transformer core temperature (79.4°C > 75°C threshold); high commuter traction load.';
      } else if (loc.id === 'LOC_WHITEFIELD') {
        temp = 68.2;
        load = 82.1;
        status = 'Warning';
        statusReason = 'Sustained peak IT park and industrial load exceeding 80 MVA capacity threshold.';
      }

      // Generate 24 hourly historical readings
      const history = [];
      for (let i = 23; i >= 0; i--) {
        const timePoint = new Date(now - i * 3600 * 1000);
        const timeLabel = timePoint.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const hour = timePoint.getHours();
        const peakMult = (hour >= 9 && hour <= 19) ? 1.25 : 0.85;
        const tempNoise = Math.sin(i * 1.2) * 2.2;

        history.push({
          timestamp: timeLabel,
          temp: Math.round((temp * (peakMult > 1 ? 1.05 : 0.92) + tempNoise) * 10) / 10,
          voltage: Math.round((voltage - (peakMult > 1 ? 4 : -2) + Math.sin(i) * 1.5) * 10) / 10,
          load: Math.round((load * peakMult + Math.cos(i * 2) * 2) * 10) / 10,
        });
      }

      return {
        sensorId: `PWR_SNS_${loc.shortName}`,
        locationId: loc.id,
        locationName: loc.name,
        transformerTempC: temp,
        voltageV: voltage,
        powerLoadMva: load,
        sensorStatus: status,
        statusReason,
        lastUpdated: new Date().toISOString(),
        history,
      };
    });
  }
}
