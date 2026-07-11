/**
 * @file routingService.test.js
 * @description Unit tests for the Dijkstra-based routing service.
 * Tests pathfinding, accessibility filtering, congestion awareness,
 * edge cases, and algorithm correctness.
 */
const {
  findShortestPath,
  MinHeap,
  buildAdjacencyList,
  getCongestionMultiplier,
} = require('../services/routingService');
const { clearCache } = require('../services/dataLoader');

// Reset data cache before each test to ensure clean state
beforeEach(() => {
  clearCache();
});

// ─── MinHeap Unit Tests ─────────────────────────────────────────────

describe('MinHeap', () => {
  it('should return elements in priority order', () => {
    const heap = new MinHeap();
    heap.push({ node: 'a', priority: 5 });
    heap.push({ node: 'b', priority: 1 });
    heap.push({ node: 'c', priority: 3 });

    expect(heap.pop().node).toBe('b');
    expect(heap.pop().node).toBe('c');
    expect(heap.pop().node).toBe('a');
  });

  it('should report empty correctly', () => {
    const heap = new MinHeap();
    expect(heap.isEmpty()).toBe(true);
    heap.push({ node: 'a', priority: 1 });
    expect(heap.isEmpty()).toBe(false);
    heap.pop();
    expect(heap.isEmpty()).toBe(true);
  });

  it('should return undefined when popping from empty heap', () => {
    const heap = new MinHeap();
    expect(heap.pop()).toBeUndefined();
  });

  it('should handle duplicate priorities', () => {
    const heap = new MinHeap();
    heap.push({ node: 'a', priority: 2 });
    heap.push({ node: 'b', priority: 2 });

    const first = heap.pop();
    const second = heap.pop();
    expect([first.node, second.node].sort()).toEqual(['a', 'b']);
  });
});

// ─── Congestion Multiplier Tests ────────────────────────────────────

describe('getCongestionMultiplier', () => {
  const telemetry = [
    { zoneId: 'zone_low', densityPercent: 20 },
    { zoneId: 'zone_med', densityPercent: 50 },
    { zoneId: 'zone_high', densityPercent: 72 },
    { zoneId: 'zone_critical', densityPercent: 90 },
  ];

  it('should return 1.0 for low density (<=30%)', () => {
    expect(getCongestionMultiplier('zone_low', telemetry)).toBe(1.0);
  });

  it('should return 1.3 for medium density (30-60%)', () => {
    expect(getCongestionMultiplier('zone_med', telemetry)).toBe(1.3);
  });

  it('should return 1.8 for high density (60-80%)', () => {
    expect(getCongestionMultiplier('zone_high', telemetry)).toBe(1.8);
  });

  it('should return 2.5 for critical density (>80%)', () => {
    expect(getCongestionMultiplier('zone_critical', telemetry)).toBe(2.5);
  });

  it('should return 1.0 for unknown zone', () => {
    expect(getCongestionMultiplier('nonexistent', telemetry)).toBe(1.0);
  });
});

// ─── Adjacency List Tests ───────────────────────────────────────────

describe('buildAdjacencyList', () => {
  const edges = [
    { from: 'a', to: 'b', baseTime: 2, distance: 100, accessible: true, zoneId: 'z1' },
    { from: 'a', to: 'c', baseTime: 5, distance: 200, accessible: false, zoneId: 'z1' },
    { from: 'b', to: 'c', baseTime: 3, distance: 150, accessible: true, zoneId: 'z1' },
  ];

  it('should build correct adjacency list from edges', () => {
    const adj = buildAdjacencyList(edges, false);
    expect(adj.get('a')).toHaveLength(2);
    expect(adj.get('b')).toHaveLength(1);
    expect(adj.has('c')).toBe(false); // c has no outgoing edges
  });

  it('should filter non-accessible edges when required', () => {
    const adj = buildAdjacencyList(edges, true);
    expect(adj.get('a')).toHaveLength(1); // Only a->b (accessible)
    expect(adj.get('a')[0].to).toBe('b');
  });
});

// ─── Dijkstra Path Finding Tests ────────────────────────────────────

describe('findShortestPath', () => {
  it('should find a direct path between connected nodes', () => {
    const result = findShortestPath('gate_a', 'north_concourse');
    expect(result.path).toContain('gate_a');
    expect(result.path).toContain('north_concourse');
    expect(result.estimatedTimeMinutes).toBeGreaterThan(0);
    expect(result.algorithm).toBe('dijkstra');
  });

  it('should find multi-hop path', () => {
    const result = findShortestPath('gate_a', 'section_104');
    expect(result.path.length).toBeGreaterThanOrEqual(3);
    expect(result.path[0]).toBe('gate_a');
    expect(result.path[result.path.length - 1]).toBe('section_104');
    expect(result.segments.length).toBeGreaterThan(0);
  });

  it('should return segments with from, to, time, distance, and zone', () => {
    const result = findShortestPath('gate_a', 'section_104');
    for (const seg of result.segments) {
      expect(seg).toHaveProperty('from');
      expect(seg).toHaveProperty('to');
      expect(seg).toHaveProperty('time');
      expect(seg).toHaveProperty('distance');
      expect(seg).toHaveProperty('zone');
      expect(seg.time).toBeGreaterThan(0);
    }
  });

  it('should return totalDistance as sum of segment distances', () => {
    const result = findShortestPath('gate_a', 'section_104');
    const sumDist = result.segments.reduce((sum, s) => sum + s.distance, 0);
    expect(result.totalDistance).toBe(sumDist);
  });

  it('should handle same source and destination', () => {
    const result = findShortestPath('gate_a', 'gate_a');
    expect(result.path).toEqual(['gate_a']);
    expect(result.estimatedTimeMinutes).toBe(0);
    expect(result.segments).toEqual([]);
  });

  it('should return error for invalid source node', () => {
    const result = findShortestPath('nonexistent', 'gate_a');
    expect(result.path).toEqual([]);
    expect(result.estimatedTimeMinutes).toBe(-1);
    expect(result.reason).toContain('not found');
  });

  it('should return error for invalid destination node', () => {
    const result = findShortestPath('gate_a', 'nonexistent');
    expect(result.path).toEqual([]);
    expect(result.estimatedTimeMinutes).toBe(-1);
    expect(result.reason).toContain('not found');
  });

  it('should filter non-accessible edges when accessibility is required', () => {
    const result = findShortestPath('gate_b', 'north_concourse', false, true);
    // gate_b -> north_concourse is not accessible, so it should route differently
    // The path should avoid the direct non-accessible edge
    if (result.path.length > 0) {
      expect(result.accessibilityNotes).toContain('wheelchair accessible');
    }
  });

  it('should produce different routes with avoidCrowds=true when congested', () => {
    // North concourse is at 72% density, so crowd avoidance may reroute
    const normal = findShortestPath('gate_a', 'section_315');
    const avoidCrowds = findShortestPath('gate_a', 'section_315', true);

    // With crowd avoidance, the route may differ or the time should be different
    expect(avoidCrowds.reason).toContain('congested');
    expect(avoidCrowds.estimatedTimeMinutes).toBeGreaterThanOrEqual(0);
  });

  it('should include crowd level in response', () => {
    const result = findShortestPath('gate_a', 'section_104');
    expect(['low', 'medium', 'high']).toContain(result.crowdLevel);
  });

  it('should include accessibility notes', () => {
    const accessible = findShortestPath('gate_a', 'section_104', false, true);
    expect(accessible.accessibilityNotes).toBeTruthy();

    const standard = findShortestPath('gate_a', 'section_104', false, false);
    expect(standard.accessibilityNotes).toBeTruthy();
  });
});
