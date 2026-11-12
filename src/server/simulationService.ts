import { db } from './db.ts';
import { RoutingService } from './routingService.ts';
import { WhatIfSimulationRequest, SimulationResult } from '../types/index.ts';

export class SimulationService {
  public static executeScenario(req: WhatIfSimulationRequest): SimulationResult {
    const locations = db.getLocations();
    const roads = db.getRoads();

    const scenarioId = `SCN_${Date.now()}`;
    const closedRoadIdsSet = new Set(req.roadClosures || []);

    // 1. Baseline metrics
    const baselineHealthScore = 86;
    const baselineAvgCongestion = Math.round(
      roads.reduce((acc, r) => acc + r.baselineCongestion, 0) / roads.length
    );
    const baselineHighRiskFloodNodes = locations.filter(
      (l) => l.baselineFloodRisk === 'HIGH' || l.baselineFloodRisk === 'CRITICAL'
    ).length;
    const baselineOpenRoads = roads.filter((r) => !r.isClosed).length;

    // 2. Cascading Simulation Logic

    // Step A: Rainfall & Topography -> Node Flood Accumulation
    const nodeImpacts = locations.map((loc) => {
      // Topographic depression factor
      const elevationDeficit = Math.max(924 - loc.elevation, 0); // up to 39m
      const topoFactor = elevationDeficit / 39; // 0 to 1

      // Drainage deficit
      const drainageDeficit = Math.max(100 - req.drainageCapacityPercent, 0) / 100; // 0 to 0.9

      // Water accumulation formula (cm)
      const rainPressure = (req.rainfallMmHr / 10) * (0.8 + topoFactor * 0.8);
      const drainageEvacuation = (req.drainageCapacityPercent / 100) * 3.8;
      const netPonding = Math.max(rainPressure - drainageEvacuation, 0);
      const waterAccumulationCm = Math.round(Math.min(netPonding * (1 + drainageDeficit * 1.5) * 1.6, 68) * 10) / 10;

      // Classification
      let floodClassification: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL' = 'LOW';
      if (waterAccumulationCm > 32 || (req.rainfallMmHr > 60 && topoFactor > 0.6)) {
        floodClassification = 'CRITICAL';
      } else if (waterAccumulationCm > 18 || (req.rainfallMmHr > 40 && topoFactor > 0.4)) {
        floodClassification = 'HIGH';
      } else if (waterAccumulationCm > 8 || req.rainfallMmHr > 20) {
        floodClassification = 'MODERATE';
      } else {
        floodClassification = 'LOW';
      }

      // Traffic congestion multiplier at this node
      // Flooded roads slow traffic in the node; general traffic multiplier applies
      const floodTrafficSurcharge = floodClassification === 'CRITICAL' ? 22 : (floodClassification === 'HIGH' ? 14 : 5);
      const rawCongestion = (loc.baselineCongestion * req.trafficVolumeMultiplier) + floodTrafficSurcharge;
      const nodeCongestion = Math.min(Math.max(Math.round(rawCongestion * 10) / 10, 15), 99);

      // Water pipeline pressure
      // High water demand drops pressure; pump strain in flooded nodes
      const basePressure = loc.baselineWaterPressure;
      const demandDrop = (req.waterDemandMultiplier - 1) * 0.8;
      const nodePressure = Math.max(Math.round((basePressure - demandDrop - (waterAccumulationCm > 25 ? 0.4 : 0)) * 10) / 10, 1.2);

      // Electricity transformer temperature (°C)
      // Base ~52°C. High electricity demand + waterlogging strain increases cooling failure
      const baseTemp = 48 + (loc.baselinePowerLoad / 4);
      const loadHeat = (req.electricityDemandMultiplier - 1) * 18;
      const floodSubstationStress = floodClassification === 'CRITICAL' ? 8.5 : 0;
      const transformerTempC = Math.round((baseTemp + loadHeat + floodSubstationStress) * 10) / 10;

      // Status determination
      let overallStatus: 'Normal' | 'Warning' | 'Critical' = 'Normal';
      if (floodClassification === 'CRITICAL' || transformerTempC > 78 || nodeCongestion > 90) {
        overallStatus = 'Critical';
      } else if (floodClassification === 'HIGH' || transformerTempC > 68 || nodeCongestion > 75) {
        overallStatus = 'Warning';
      }

      // At-risk population in this node's ward
      const riskFraction = overallStatus === 'Critical' ? 0.65 : (overallStatus === 'Warning' ? 0.32 : 0.05);
      const affectedPopulation = Math.round(loc.population * riskFraction);

      return {
        locationId: loc.id,
        locationName: loc.name,
        floodClassification,
        waterAccumulationCm,
        congestionPercent: nodeCongestion,
        waterPressureBar: nodePressure,
        transformerTempC,
        overallStatus,
        affectedPopulation,
      };
    });

    // Step B: Road Network Cascading Impacts
    const simulatedRoadImpacts = roads.map((road) => {
      const fromNodeImpact = nodeImpacts.find((n) => n.locationId === road.fromNodeId);
      const toNodeImpact = nodeImpacts.find((n) => n.locationId === road.toNodeId);

      // Water accumulation on the road is average of endpoints + susceptibility bonus
      const endpointAvgWater = ((fromNodeImpact?.waterAccumulationCm || 0) + (toNodeImpact?.waterAccumulationCm || 0)) / 2;
      const susceptibilityMult = road.floodSusceptibility === 'critical' ? 1.4 : (road.floodSusceptibility === 'high' ? 1.2 : 0.8);
      const roadWaterCm = Math.round((endpointAvgWater * susceptibilityMult) * 10) / 10;

      // Check if manually closed or impassable by water
      const isManuallyClosed = closedRoadIdsSet.has(road.id);
      const isFloodedOut = roadWaterCm > 28; // Water above 28cm impassable for normal vehicles

      let isPassable = !isManuallyClosed && !isFloodedOut;
      let status: 'optimal' | 'congested' | 'waterlogged' | 'closed' = 'optimal';
      let closureReason: string | undefined = undefined;

      if (isManuallyClosed) {
        status = 'closed';
        closureReason = 'Manually closed in simulation scenario';
      } else if (isFloodedOut) {
        status = 'waterlogged';
        closureReason = `Waterlogged impassable: water depth reaches ${roadWaterCm} cm`;
      }

      // Traffic surcharge if road remains open (diverted traffic)
      let roadCongestion = road.baselineCongestion * req.trafficVolumeMultiplier;
      if (!isPassable) {
        roadCongestion = 0; // No traffic flowing through closed road
      } else {
        // Additional diversion congestion
        const diversionSurge = (closedRoadIdsSet.size + (isFloodedOut ? 1 : 0)) * 3.5;
        roadCongestion = Math.min(Math.round(roadCongestion + diversionSurge), 99);
        if (roadCongestion > 75) status = 'congested';
      }

      return {
        roadId: road.id,
        name: road.name,
        isPassable,
        congestionPercent: roadCongestion,
        waterAccumulationCm: roadWaterCm,
        status,
        closureReason,
      };
    });

    // Step C: High-level simulated metrics
    const highRiskFloodCount = nodeImpacts.filter(
      (n) => n.floodClassification === 'HIGH' || n.floodClassification === 'CRITICAL'
    ).length;
    const stressedInfraCount = nodeImpacts.filter(
      (n) => n.transformerTempC > 70 || n.waterPressureBar < 2.0
    ).length;
    const openRoadsCount = simulatedRoadImpacts.filter((r) => r.isPassable).length;

    const openRoadCongestions = simulatedRoadImpacts.filter((r) => r.isPassable).map((r) => r.congestionPercent);
    const avgSimulatedCongestion = openRoadCongestions.length > 0
      ? Math.round(openRoadCongestions.reduce((a, b) => a + b, 0) / openRoadCongestions.length)
      : 99;

    const totalAtRiskPop = nodeImpacts.reduce((sum, n) => sum + n.affectedPopulation, 0);

    // City Health Score: 0 - 100
    // Penalties: flood risk nodes (-7 each), stressed infra (-6 each), closed roads (-4 each), congestion (-0.3 * over baseline)
    let healthDeductions = (highRiskFloodCount * 7.5) + (stressedInfraCount * 6.0) + ((roads.length - openRoadsCount) * 4.0);
    healthDeductions += Math.max(avgSimulatedCongestion - 60, 0) * 0.45;
    const simulatedHealthScore = Math.max(Math.round((baselineHealthScore - healthDeductions) * 10) / 10, 12);

    // Step D: Infrastructure Stress Scores
    const waterStressScore = Math.min(Math.round(req.waterDemandMultiplier * 45 + (100 - req.drainageCapacityPercent) * 0.4), 100);
    const powerGridStressScore = Math.min(Math.round(req.electricityDemandMultiplier * 48 + (highRiskFloodCount * 6)), 100);
    const drainageDeficitPct = Math.round(Math.max((req.rainfallMmHr * 0.6) - (req.drainageCapacityPercent * 0.4), -20));

    const highTempTransformers = nodeImpacts
      .filter((n) => n.transformerTempC > 72)
      .map((n) => `${n.locationName} (${n.transformerTempC}°C)`);
    const lowPressureWaterZones = nodeImpacts
      .filter((n) => n.waterPressureBar < 2.4)
      .map((n) => `${n.locationName} (${n.waterPressureBar} bar)`);

    // Step E: Emergency Rerouting Demonstration (Majestic to Whitefield default test)
    const originId = req.emergencyOriginId || 'LOC_MAJESTIC';
    const destId = req.emergencyDestinationId || 'LOC_WHITEFIELD';
    const originNode = db.getLocationById(originId) || locations[2];
    const destNode = db.getLocationById(destId) || locations[8];

    // Baseline route
    const baselineRoute = RoutingService.calculateRoute({
      vehicleType: 'Ambulance',
      originId,
      destinationId: destId,
      avoidClosedRoads: true,
      considerTraffic: true,
      considerFlood: true,
      customClosedRoadIds: [],
    });

    // Simulated route taking into account all simulated closed/flooded roads
    const impassableIds = simulatedRoadImpacts.filter((r) => !r.isPassable).map((r) => r.roadId);
    const simulatedRoute = RoutingService.calculateRoute({
      vehicleType: 'Ambulance',
      originId,
      destinationId: destId,
      avoidClosedRoads: true,
      considerTraffic: true,
      considerFlood: true,
      customClosedRoadIds: impassableIds,
    });

    const baselineTime = baselineRoute.estimatedTravelTimeMin || 32;
    const simTime = simulatedRoute.estimatedTravelTimeMin || 999;
    const timeDeltaPct = baselineTime > 0 ? Math.round(((simTime - baselineTime) / baselineTime) * 100) : 0;
    const routeAltered = JSON.stringify(baselineRoute.routeNodeIds) !== JSON.stringify(simulatedRoute.routeNodeIds);

    // Cascading narrative chain
    const cascadingChainSummary: string[] = [
      `Rainfall of ${req.rainfallMmHr} mm/hr with ${req.drainageCapacityPercent}% drainage capacity triggers ${highRiskFloodCount} high-risk flood zones across low elevation basins.`,
      `${roads.length - openRoadsCount} road corridors rendered impassable due to waterlogging or manual closures.`,
      `Displaced vehicular traffic increases average congestion across open arterials from ${baselineAvgCongestion}% to ${avgSimulatedCongestion}%.`,
      `Transformer thermal stress escalates at ${highTempTransformers.length} distribution substations; power grid stress score reached ${powerGridStressScore}/100.`,
      `Emergency transit time from ${originNode.name} to ${destNode.name} changed by ${timeDeltaPct >= 0 ? '+' : ''}${timeDeltaPct}% (${baselineTime} min -> ${simTime} min).`,
      `Overall City Health Score drops by ${Math.round((baselineHealthScore - simulatedHealthScore) * 10) / 10} points (from ${baselineHealthScore} to ${simulatedHealthScore}).`,
    ];

    const result: SimulationResult = {
      scenarioId,
      inputs: req,
      timestamp: new Date().toISOString(),
      baseline: {
        cityHealthScore: baselineHealthScore,
        avgCongestionPercent: baselineAvgCongestion,
        highRiskFloodNodesCount: baselineHighRiskFloodNodes,
        stressedInfraNodesCount: 1,
        openRoadsCount: baselineOpenRoads,
      },
      simulated: {
        cityHealthScore: simulatedHealthScore,
        avgCongestionPercent: avgSimulatedCongestion,
        highRiskFloodNodesCount: highRiskFloodCount,
        stressedInfraNodesCount: stressedInfraCount,
        openRoadsCount: openRoadsCount,
        estimatedAtRiskPopulation: totalAtRiskPop,
      },
      nodeImpacts,
      roadImpacts: simulatedRoadImpacts,
      infrastructureStress: {
        waterStressScore,
        powerGridStressScore,
        drainageSurplusDeficit: drainageDeficitPct,
        highTempTransformers,
        lowPressureWaterZones,
      },
      emergencyRerouting: {
        originName: originNode.name,
        destinationName: destNode.name,
        baselineTimeMin: baselineTime,
        simulatedTimeMin: simTime,
        timeDeltaPercent: timeDeltaPct,
        routeAltered,
        divertedRoads: impassableIds,
      },
      cascadingChainSummary,
    };

    // Save scenario to history
    db.saveSimulationResult(result);

    return result;
  }
}
