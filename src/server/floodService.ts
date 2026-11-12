import { db } from './db.ts';
import { FloodPredictionRequest, FloodPredictionResult } from '../types/index.ts';

export class FloodPredictionService {
  public static predict(req: FloodPredictionRequest): FloodPredictionResult {
    const location = db.getLocationById(req.locationId) || db.getLocations()[0];
    const elevation = req.elevationMeters ?? location.elevation;

    // Topographic depression factor (Bengaluru baseline is ~920m at highest ridge, 885m at Silk Board/Bellandur basin)
    // Lower elevation = higher ponding potential
    const elevationDeficit = Math.max(924 - elevation, 0); // 0 to ~39m
    const topographicFactor = Math.min((elevationDeficit / 39) * 100, 100);

    // Rainfall intensity factor (0 - 150 mm/hr)
    const rainfallFactor = Math.min((req.rainfallMmHr / 100) * 100, 100);

    // Drainage deficit factor (100% capacity means 0% deficit; 20% capacity means 80% deficit)
    const drainageDeficitFactor = Math.max(100 - req.drainageCapacityPercent, 0);

    // Soil saturation factor
    const soilFactor = Math.min(Math.max(req.soilSaturationPercent, 0), 100);

    // Weighted Flood Probability Index
    // Physical hydrology formula:
    // Runoff Q = C * I * A
    // In urban concrete Bengaluru, runoff coefficient C is high (0.85+).
    // Risk score = 0.35 * Rainfall + 0.25 * DrainageDeficit + 0.25 * TopoFactor + 0.15 * SoilFactor
    const compositeRisk = (
      0.35 * rainfallFactor +
      0.25 * drainageDeficitFactor +
      0.25 * topographicFactor +
      0.15 * soilFactor
    );

    const riskProbabilityPercent = Math.min(Math.max(Math.round(compositeRisk * 10) / 10, 5), 99);

    // Classification
    let classification: FloodPredictionResult['classification'] = 'LOW';
    if (riskProbabilityPercent >= 75) {
      classification = 'CRITICAL';
    } else if (riskProbabilityPercent >= 50) {
      classification = 'HIGH';
    } else if (riskProbabilityPercent >= 30) {
      classification = 'MODERATE';
    } else {
      classification = 'LOW';
    }

    // Estimated water accumulation in cm:
    // Net precipitation exceeding drainage rate ponding depth
    const effectiveRainDepthCm = (req.rainfallMmHr / 10) * (soilFactor / 100); // cm
    const drainageDischargeRateCm = (req.drainageCapacityPercent / 100) * 4.0; // cm/hr drainage
    const netPondingCm = Math.max(effectiveRainDepthCm - drainageDischargeRateCm, 0);
    const accumulationMultiplier = 1 + (topographicFactor / 50);
    const rawWaterAccumulationCm = netPondingCm * accumulationMultiplier * (req.rainfallMmHr > 20 ? 1.4 : 0.8);
    const estimatedWaterAccumulationCm = Math.round(Math.min(rawWaterAccumulationCm, 65) * 10) / 10;

    // Detailed explanatory text based on location hydrology
    let explanation = '';
    const advice: string[] = [];

    if (location.id === 'LOC_SILKBOARD') {
      explanation = `Silk Board sits at Bengaluru's lowest basin contour (${elevation}m MSL). Inbound stormwater runoff from elevated BTM Layout and Madivala overflow channels funnels directly into this junction. With rainfall at ${req.rainfallMmHr} mm/hr and ${req.drainageCapacityPercent}% drainage capacity, stormwater accumulates at ~${estimatedWaterAccumulationCm} cm depth.`;
      advice.push('Mobilize emergency storm water pumping units at Silk Board underpass.');
      advice.push('Pre-alert BMTC and Bangalore Traffic Police for heavy vehicle diversions via Outer Ring Road flyover.');
    } else if (location.id === 'LOC_KRMARKET') {
      explanation = `KR Market (${elevation}m) is surrounded by historic high-density commercial settlements with aging stormwater drains. Low soil permeability combined with ${req.soilSaturationPercent}% soil saturation forces instant street-level surface runoff accumulation of ~${estimatedWaterAccumulationCm} cm.`;
      advice.push('Clear secondary storm drain grates along Avenue Road and Kalasipalya.');
      advice.push('Activate backup diesel generators for market basement sump pumps.');
    } else if (location.id === 'LOC_KORAMANGALA') {
      explanation = `Koramangala 4th and 6th blocks lie directly adjacent to the primary Rajakaluve (stormwater drain) carrying runoff to Bellandur Lake. High runoff combined with drainage deficit triggers localized canal overflow risk.`;
      advice.push('Monitor primary Rajakaluve sluice gates into Bellandur lake catchment.');
      advice.push('Restrict low-clearance residential vehicular parking on 80-Ft Road.');
    } else if (location.id === 'LOC_HEBBAL') {
      explanation = `Hebbal flyover underpass is a grade-separated depression vulnerable to rapid flash pooling during downpours over 30 mm/hr, causing inbound airport delays.`;
      advice.push('Check automated sub-surface underpass bilge sensors.');
      advice.push('Divert grade-level traffic to upper elevated expressway if depth exceeds 15 cm.');
    } else {
      explanation = `${location.name} (${elevation}m MSL) maintains relatively stable natural drainage slopes. However, sustained precipitation of ${req.rainfallMmHr} mm/hr combined with ${req.soilSaturationPercent}% soil saturation yields an estimated surface accumulation of ~${estimatedWaterAccumulationCm} cm.`;
      advice.push('Maintain regular drainage surveillance and clear leaf litter from roadside catch pits.');
      advice.push('Keep standard rapid-response clearance units on standby.');
    }

    return {
      locationId: location.id,
      locationName: location.name,
      classification,
      riskProbabilityPercent,
      estimatedWaterAccumulationCm,
      elevationMeters: elevation,
      contributingFactors: {
        rainfallFactor: Math.round(rainfallFactor),
        drainageDeficitFactor: Math.round(drainageDeficitFactor),
        topographicDepressionFactor: Math.round(topographicFactor),
        soilRunoffIndex: Math.round(soilFactor),
      },
      explanation,
      mitigationAdvice: advice,
      predictionTimestamp: new Date().toISOString(),
    };
  }
}
