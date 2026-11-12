import { db } from './db.ts';
import {
  EmergencyRouteRequest,
  EmergencyRouteResult,
  RouteSegment,
  AvoidedRoad,
  RoadLink,
} from '../types/index.ts';

interface GraphEdge {
  targetNodeId: string;
  road: RoadLink;
  weight: number;
}

export class RoutingService {
  /**
   * Calculates optimal emergency route using Dijkstra's algorithm with dynamic weights
   */
  public static calculateRoute(req: EmergencyRouteRequest): EmergencyRouteResult {
    const locations = db.getLocations();
    const allRoads = db.getRoads();

    const origin = db.getLocationById(req.originId) || locations[2]; // Default Majestic
    const destination = db.getLocationById(req.destinationId) || locations[8]; // Default Whitefield

    const customClosedSet = new Set(req.customClosedRoadIds || []);
    const avoidedRoadsMap: Map<string, AvoidedRoad> = new Map();

    // Construct adjacency list
    const graph: Map<string, GraphEdge[]> = new Map();
    for (const loc of locations) {
      graph.set(loc.id, []);
    }

    for (const road of allRoads) {
      const fromLoc = db.getLocationById(road.fromNodeId);
      const toLoc = db.getLocationById(road.toNodeId);
      const fromName = fromLoc?.name || road.fromNodeId;
      const toName = toLoc?.name || road.toNodeId;

      const isManuallyClosed = road.isClosed || customClosedSet.has(road.id);

      // Severe flood condition check
      const isSevereFlood = req.considerFlood && (
        road.waterAccumulationCm > (req.vehicleType === 'Disaster Rescue' ? 45 : (req.vehicleType === 'Fire Brigade' ? 30 : 18))
      );

      // Severe gridlock check
      const isGridlock = req.considerTraffic && road.currentCongestion > 94;

      if (req.avoidClosedRoads && isManuallyClosed) {
        avoidedRoadsMap.set(road.id, {
          roadId: road.id,
          roadName: road.name,
          fromNodeName: fromName,
          toNodeName: toName,
          reason: road.closureReason || 'Manually closed by City Traffic Operations',
        });
        continue; // Exclude from graph
      }

      if (isSevereFlood) {
        avoidedRoadsMap.set(road.id, {
          roadId: road.id,
          roadName: road.name,
          fromNodeName: fromName,
          toNodeName: toName,
          reason: `Severe stormwater ponding (${road.waterAccumulationCm} cm) exceeds safe depth for ${req.vehicleType}`,
        });
        continue; // Exclude from graph
      }

      // Calculate cost weight (in equivalent travel minutes)
      // Base time in minutes = (distance / speedLimit) * 60
      let effectiveSpeed = road.speedLimitKmh;
      if (req.considerTraffic) {
        effectiveSpeed = Math.max(road.currentSpeedKmh, 8);
      }

      let segmentMinutes = (road.distanceKm / effectiveSpeed) * 60;

      // Penalties based on vehicle type and risk
      if (req.considerTraffic) {
        // High traffic penalty
        const congestionRatio = road.currentCongestion / 100;
        segmentMinutes += (congestionRatio * 5.0);
      }

      if (req.considerFlood && road.waterAccumulationCm > 5) {
        // Water slowdown penalty
        segmentMinutes += (road.waterAccumulationCm / 4.0);
      }

      // Vehicle specific modifiers
      if (req.vehicleType === 'Fire Brigade' && road.lanes < 4) {
        segmentMinutes += 4.0; // Narrow road penalty for heavy fire engines
      } else if (req.vehicleType === 'Ambulance') {
        // Ambulances prioritize smooth, multi-lane roads with higher speed limits
        if (road.lanes >= 6) segmentMinutes *= 0.85;
      }

      const edgeForward: GraphEdge = {
        targetNodeId: road.toNodeId,
        road,
        weight: segmentMinutes,
      };

      const edgeBackward: GraphEdge = {
        targetNodeId: road.fromNodeId,
        road,
        weight: segmentMinutes,
      };

      graph.get(road.fromNodeId)?.push(edgeForward);
      graph.get(road.toNodeId)?.push(edgeBackward);
    }

    // Dijkstra's Algorithm
    const distances: Map<string, number> = new Map();
    const previous: Map<string, { nodeId: string; road: RoadLink } | null> = new Map();
    const unvisited = new Set<string>();

    for (const loc of locations) {
      distances.set(loc.id, Infinity);
      previous.set(loc.id, null);
      unvisited.add(loc.id);
    }

    distances.set(origin.id, 0);

    while (unvisited.size > 0) {
      // Find node with minimum distance
      let currentId: string | null = null;
      let minDistance = Infinity;

      for (const id of unvisited) {
        const dist = distances.get(id)!;
        if (dist < minDistance) {
          minDistance = dist;
          currentId = id;
        }
      }

      if (currentId === null || minDistance === Infinity) {
        break; // Unreachable nodes
      }

      if (currentId === destination.id) {
        break; // Reached destination
      }

      unvisited.delete(currentId);

      const neighbors = graph.get(currentId) || [];
      for (const edge of neighbors) {
        if (!unvisited.has(edge.targetNodeId)) continue;

        const candidateDistance = distances.get(currentId)! + edge.weight;
        if (candidateDistance < distances.get(edge.targetNodeId)!) {
          distances.set(edge.targetNodeId, candidateDistance);
          previous.set(edge.targetNodeId, { nodeId: currentId, road: edge.road });
        }
      }
    }

    // Reconstruct path
    const routeNodeIds: string[] = [];
    const routeSegments: RouteSegment[] = [];
    let curr = destination.id;

    if (distances.get(destination.id) === Infinity) {
      // No path found (isolated network due to closures)
      return {
        vehicleType: req.vehicleType,
        origin,
        destination,
        routeNodeIds: [origin.id],
        routeNodeNames: [origin.name],
        routeSegments: [],
        totalDistanceKm: 0,
        estimatedTravelTimeMin: 0,
        avoidedRoads: Array.from(avoidedRoadsMap.values()),
        navigationInstructions: ['CRITICAL: No viable road path found due to multiple road closures or waterlogging barriers.'],
        algorithmUsed: 'Dijkstra Priority Graph Solver (Zero Feasible Path)',
        alternativeRouteAvailable: false,
        timestamp: new Date().toISOString(),
      };
    }

    while (curr !== origin.id) {
      routeNodeIds.unshift(curr);
      const prevEntry = previous.get(curr);
      if (!prevEntry) break;

      const fromLoc = db.getLocationById(prevEntry.nodeId);
      const toLoc = db.getLocationById(curr);
      const road = prevEntry.road;

      const effectiveSpeed = req.considerTraffic ? Math.max(road.currentSpeedKmh, 10) : road.speedLimitKmh;
      const segmentTime = Math.round(((road.distanceKm / effectiveSpeed) * 60) * 10) / 10;

      routeSegments.unshift({
        roadId: road.id,
        roadName: road.name,
        fromNodeId: prevEntry.nodeId,
        fromNodeName: fromLoc?.name || prevEntry.nodeId,
        toNodeId: curr,
        toNodeName: toLoc?.name || curr,
        distanceKm: road.distanceKm,
        congestionPercent: road.currentCongestion,
        speedKmh: road.currentSpeedKmh,
        waterLevelCm: road.waterAccumulationCm,
        travelTimeMin: segmentTime,
        isClosed: road.isClosed,
      });

      curr = prevEntry.nodeId;
    }
    routeNodeIds.unshift(origin.id);

    const routeNodeNames = routeNodeIds.map((id) => db.getLocationById(id)?.name || id);
    const totalDistanceKm = Math.round(routeSegments.reduce((sum, s) => sum + s.distanceKm, 0) * 10) / 10;
    const estimatedTravelTimeMin = Math.round(routeSegments.reduce((sum, s) => sum + s.travelTimeMin, 0) * 10) / 10;

    // Build navigation guidance
    const navigationInstructions: string[] = [
      `Dispatch ${req.vehicleType} from ${origin.name} Station. Target: ${destination.name}.`,
    ];

    routeSegments.forEach((seg, idx) => {
      navigationInstructions.push(
        `Step ${idx + 1}: Take ${seg.roadName} towards ${seg.toNodeName} (${seg.distanceKm} km · Est. ${seg.travelTimeMin} min · ${seg.congestionPercent}% traffic · ${seg.waterLevelCm}cm water).`
      );
    });
    navigationInstructions.push(`Arrival at ${destination.name} Emergency Zone.`);

    return {
      vehicleType: req.vehicleType,
      origin,
      destination,
      routeNodeIds,
      routeNodeNames,
      routeSegments,
      totalDistanceKm,
      estimatedTravelTimeMin,
      avoidedRoads: Array.from(avoidedRoadsMap.values()),
      navigationInstructions,
      algorithmUsed: 'Dijkstra Multi-Cost Graph Routing (Real-Time Congestion & Flood Penalty Matrix)',
      alternativeRouteAvailable: true,
      timestamp: new Date().toISOString(),
    };
  }
}
