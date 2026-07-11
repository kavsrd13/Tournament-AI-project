/**
 * @module routingService
 * @description Congestion-aware and accessibility-aware routing using
 * Dijkstra's shortest path algorithm. Weights edges by base travel time
 * adjusted for real-time zone density from telemetry data.
 */
const { getStadiumGraph, getTelemetry } = require('./dataLoader');

/**
 * Min-heap priority queue for Dijkstra's algorithm.
 * Each element is { node: string, priority: number }.
 */
class MinHeap {
  constructor() {
    /** @type {Array<{node: string, priority: number}>} */
    this.heap = [];
  }

  /** @param {{node: string, priority: number}} element */
  push(element) {
    this.heap.push(element);
    this._bubbleUp(this.heap.length - 1);
  }

  /** @returns {{node: string, priority: number}|undefined} */
  pop() {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0 && last) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  /** @returns {boolean} */
  isEmpty() {
    return this.heap.length === 0;
  }

  /** @private */
  _bubbleUp(idx) {
    while (idx > 0) {
      const parent = Math.floor((idx - 1) / 2);
      if (this.heap[parent].priority <= this.heap[idx].priority) break;
      [this.heap[parent], this.heap[idx]] = [this.heap[idx], this.heap[parent]];
      idx = parent;
    }
  }

  /** @private */
  _sinkDown(idx) {
    const length = this.heap.length;
    while (true) {
      let smallest = idx;
      const left = 2 * idx + 1;
      const right = 2 * idx + 2;

      if (left < length && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < length && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }
      if (smallest === idx) break;
      [this.heap[smallest], this.heap[idx]] = [this.heap[idx], this.heap[smallest]];
      idx = smallest;
    }
  }
}

/**
 * Builds an adjacency list from the stadium graph.
 * @param {Array} edges - Graph edges
 * @param {boolean} requireAccessibility - If true, exclude non-accessible edges
 * @returns {Map<string, Array<{to: string, weight: number, distance: number, accessible: boolean, zoneId: string}>>}
 */
function buildAdjacencyList(edges, requireAccessibility) {
  const adj = new Map();

  for (const edge of edges) {
    // Skip non-accessible edges when accessibility is required
    if (requireAccessibility && !edge.accessible) continue;

    if (!adj.has(edge.from)) adj.set(edge.from, []);
    adj.get(edge.from).push({
      to: edge.to,
      weight: edge.baseTime,
      distance: edge.distance,
      accessible: edge.accessible,
      zoneId: edge.zoneId,
    });
  }

  return adj;
}

/**
 * Calculates congestion multiplier for a zone based on telemetry.
 * Density 0-30%: 1.0x, 30-60%: 1.3x, 60-80%: 1.8x, 80%+: 2.5x
 * @param {string} zoneId - Zone identifier
 * @param {Array} telemetry - Telemetry data array
 * @returns {number} Multiplier >= 1.0
 */
function getCongestionMultiplier(zoneId, telemetry) {
  const zone = telemetry.find((t) => t.zoneId === zoneId);
  if (!zone) return 1.0;

  const density = zone.densityPercent;
  if (density <= 30) return 1.0;
  if (density <= 60) return 1.3;
  if (density <= 80) return 1.8;
  return 2.5;
}

/**
 * Finds the shortest path between two nodes using Dijkstra's algorithm.
 * Supports congestion-aware and accessibility-aware routing.
 *
 * @param {string} from - Source node ID
 * @param {string} to - Destination node ID
 * @param {boolean} [avoidCrowds=false] - If true, applies congestion multipliers to edge weights
 * @param {boolean} [requireAccessibility=false] - If true, only uses accessible edges
 * @returns {{
 *   path: string[],
 *   estimatedTimeMinutes: number,
 *   totalDistance: number,
 *   segments: Array<{from: string, to: string, time: number, distance: number, zone: string}>,
 *   crowdLevel: string,
 *   accessibilityNotes: string,
 *   reason: string,
 *   algorithm: string
 * }}
 */
function findShortestPath(from, to, avoidCrowds = false, requireAccessibility = false) {
  const graph = getStadiumGraph();
  const telemetry = getTelemetry();

  // Validate that nodes exist in the graph
  const nodeIds = new Set(graph.nodes.map((n) => n.id));
  if (!nodeIds.has(from)) {
    return {
      path: [],
      estimatedTimeMinutes: -1,
      totalDistance: 0,
      segments: [],
      crowdLevel: 'unknown',
      accessibilityNotes: 'N/A',
      reason: `Source node "${from}" not found in the stadium graph.`,
      algorithm: 'dijkstra',
    };
  }
  if (!nodeIds.has(to)) {
    return {
      path: [],
      estimatedTimeMinutes: -1,
      totalDistance: 0,
      segments: [],
      crowdLevel: 'unknown',
      accessibilityNotes: 'N/A',
      reason: `Destination node "${to}" not found in the stadium graph.`,
      algorithm: 'dijkstra',
    };
  }

  // Same source and destination
  if (from === to) {
    return {
      path: [from],
      estimatedTimeMinutes: 0,
      totalDistance: 0,
      segments: [],
      crowdLevel: 'low',
      accessibilityNotes: requireAccessibility ? 'You are already at your destination.' : 'N/A',
      reason: 'Source and destination are the same.',
      algorithm: 'dijkstra',
    };
  }

  const adj = buildAdjacencyList(graph.edges, requireAccessibility);

  // Dijkstra's algorithm with min-heap
  const dist = new Map();
  const prev = new Map();
  const edgeUsed = new Map(); // track which edge was used to reach each node
  const pq = new MinHeap();

  for (const node of graph.nodes) {
    dist.set(node.id, Infinity);
  }
  dist.set(from, 0);
  pq.push({ node: from, priority: 0 });

  while (!pq.isEmpty()) {
    const { node: current, priority: currentDist } = pq.pop();

    // Skip if we've already found a better path
    if (currentDist > dist.get(current)) continue;

    // Early termination if we've reached the destination
    if (current === to) break;

    const neighbors = adj.get(current) || [];
    for (const edge of neighbors) {
      let weight = edge.weight;

      // Apply congestion multiplier when avoiding crowds
      if (avoidCrowds) {
        weight *= getCongestionMultiplier(edge.zoneId, telemetry);
      }

      const newDist = dist.get(current) + weight;
      if (newDist < dist.get(edge.to)) {
        dist.set(edge.to, newDist);
        prev.set(edge.to, current);
        edgeUsed.set(edge.to, edge);
        pq.push({ node: edge.to, priority: newDist });
      }
    }
  }

  // Reconstruct path
  if (dist.get(to) === Infinity) {
    const reason = requireAccessibility
      ? 'No accessible path found. Some routes may require stairs or non-accessible passages.'
      : 'No path found between the specified locations.';

    return {
      path: [],
      estimatedTimeMinutes: -1,
      totalDistance: 0,
      segments: [],
      crowdLevel: 'unknown',
      accessibilityNotes: requireAccessibility ? 'Accessible route unavailable.' : 'N/A',
      reason,
      algorithm: 'dijkstra',
    };
  }

  // Build path and segments
  const path = [];
  let current = to;
  while (current !== undefined) {
    path.unshift(current);
    current = prev.get(current);
  }

  const segments = [];
  let totalDistance = 0;
  for (let i = 1; i < path.length; i++) {
    const edge = edgeUsed.get(path[i]);
    if (edge) {
      let time = edge.weight;
      if (avoidCrowds) {
        time *= getCongestionMultiplier(edge.zoneId, telemetry);
      }
      segments.push({
        from: path[i - 1],
        to: path[i],
        time: Math.round(time * 10) / 10,
        distance: edge.distance,
        zone: edge.zoneId,
      });
      totalDistance += edge.distance;
    }
  }

  // Determine overall crowd level based on zones traversed
  const maxDensity = Math.max(
    ...segments.map((s) => {
      const zone = telemetry.find((t) => t.zoneId === s.zone);
      return zone ? zone.densityPercent : 0;
    })
  );
  const crowdLevel = maxDensity > 70 ? 'high' : maxDensity > 40 ? 'medium' : 'low';

  // Build reason string
  let reason = `Optimal path computed via Dijkstra's algorithm (${path.length - 1} segments, ${totalDistance}m).`;
  if (avoidCrowds) {
    reason += ' Route adjusted to minimize exposure to congested zones.';
  }
  if (requireAccessibility) {
    reason += ' Path is fully wheelchair accessible with elevator/ramp access.';
  }

  return {
    path,
    estimatedTimeMinutes: Math.round(dist.get(to) * 10) / 10,
    totalDistance,
    segments,
    crowdLevel,
    accessibilityNotes: requireAccessibility
      ? 'Path is fully wheelchair accessible. Elevators and ramps are available throughout.'
      : 'Standard route. Some segments may include stairs.',
    reason,
    algorithm: 'dijkstra',
  };
}

module.exports = {
  findShortestPath,
  MinHeap,
  buildAdjacencyList,
  getCongestionMultiplier,
};
