/**
 * @module generate_data
 * @description Generates synthetic stadium data files for TournamentPulse AI.
 * Creates realistic FIFA World Cup 2026 operational data including
 * stadium graph, zones, telemetry, transport, incidents, sustainability,
 * and FAQ data. Run with: node generate_data.js
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

/** Stadium graph with 18 nodes and bidirectional edges */
const stadiumGraph = {
  nodes: [
    { id: 'gate_a', name: 'Gate A', type: 'gate', lat: 25.774, lng: -80.194 },
    { id: 'gate_b', name: 'Gate B', type: 'gate', lat: 25.775, lng: -80.192 },
    { id: 'gate_c', name: 'Gate C', type: 'gate', lat: 25.776, lng: -80.190 },
    { id: 'gate_d', name: 'Gate D', type: 'gate', lat: 25.773, lng: -80.191 },
    { id: 'north_concourse', name: 'North Concourse', type: 'concourse', lat: 25.775, lng: -80.193 },
    { id: 'south_concourse', name: 'South Concourse', type: 'concourse', lat: 25.773, lng: -80.193 },
    { id: 'east_concourse', name: 'East Concourse', type: 'concourse', lat: 25.774, lng: -80.191 },
    { id: 'section_104', name: 'Section 104', type: 'section', lat: 25.774, lng: -80.193 },
    { id: 'section_210', name: 'Section 210', type: 'section', lat: 25.775, lng: -80.192 },
    { id: 'section_315', name: 'Section 315', type: 'section', lat: 25.774, lng: -80.192 },
    { id: 'transit_link_a', name: 'Transit Link A (Metro)', type: 'transit', lat: 25.776, lng: -80.195 },
    { id: 'transit_link_b', name: 'Transit Link B (Bus)', type: 'transit', lat: 25.772, lng: -80.189 },
    { id: 'refill_point_a', name: 'Water Refill A', type: 'amenity', lat: 25.775, lng: -80.193 },
    { id: 'refill_point_b', name: 'Water Refill B', type: 'amenity', lat: 25.773, lng: -80.192 },
    { id: 'first_aid', name: 'First Aid Station', type: 'amenity', lat: 25.774, lng: -80.194 },
    { id: 'restroom_north', name: 'Restroom North', type: 'amenity', lat: 25.775, lng: -80.194 },
    { id: 'restroom_south', name: 'Restroom South', type: 'amenity', lat: 25.773, lng: -80.194 },
    { id: 'food_court', name: 'Food Court', type: 'amenity', lat: 25.774, lng: -80.191 },
  ],
  edges: [
    // Gate A <-> North Concourse
    { from: 'gate_a', to: 'north_concourse', distance: 100, accessible: true, baseTime: 2, zoneId: 'zone_north' },
    { from: 'north_concourse', to: 'gate_a', distance: 100, accessible: true, baseTime: 2, zoneId: 'zone_north' },
    // Gate B <-> North Concourse (NOT accessible — stairs only)
    { from: 'gate_b', to: 'north_concourse', distance: 150, accessible: false, baseTime: 3, zoneId: 'zone_north' },
    { from: 'north_concourse', to: 'gate_b', distance: 150, accessible: false, baseTime: 3, zoneId: 'zone_north' },
    // Gate B <-> East Concourse
    { from: 'gate_b', to: 'east_concourse', distance: 120, accessible: true, baseTime: 2, zoneId: 'zone_east' },
    { from: 'east_concourse', to: 'gate_b', distance: 120, accessible: true, baseTime: 2, zoneId: 'zone_east' },
    // Gate C <-> East Concourse
    { from: 'gate_c', to: 'east_concourse', distance: 80, accessible: true, baseTime: 1, zoneId: 'zone_east' },
    { from: 'east_concourse', to: 'gate_c', distance: 80, accessible: true, baseTime: 1, zoneId: 'zone_east' },
    // Gate D <-> South Concourse
    { from: 'gate_d', to: 'south_concourse', distance: 110, accessible: true, baseTime: 2, zoneId: 'zone_south' },
    { from: 'south_concourse', to: 'gate_d', distance: 110, accessible: true, baseTime: 2, zoneId: 'zone_south' },
    // Concourse <-> Sections
    { from: 'north_concourse', to: 'section_104', distance: 200, accessible: true, baseTime: 4, zoneId: 'zone_north' },
    { from: 'section_104', to: 'north_concourse', distance: 200, accessible: true, baseTime: 4, zoneId: 'zone_north' },
    { from: 'north_concourse', to: 'section_210', distance: 250, accessible: true, baseTime: 5, zoneId: 'zone_north' },
    { from: 'section_210', to: 'north_concourse', distance: 250, accessible: true, baseTime: 5, zoneId: 'zone_north' },
    { from: 'east_concourse', to: 'section_315', distance: 180, accessible: true, baseTime: 3, zoneId: 'zone_east' },
    { from: 'section_315', to: 'east_concourse', distance: 180, accessible: true, baseTime: 3, zoneId: 'zone_east' },
    { from: 'south_concourse', to: 'section_104', distance: 300, accessible: false, baseTime: 6, zoneId: 'zone_south' },
    { from: 'section_104', to: 'south_concourse', distance: 300, accessible: false, baseTime: 6, zoneId: 'zone_south' },
    // Concourse interconnections
    { from: 'north_concourse', to: 'east_concourse', distance: 220, accessible: true, baseTime: 4, zoneId: 'zone_north' },
    { from: 'east_concourse', to: 'north_concourse', distance: 220, accessible: true, baseTime: 4, zoneId: 'zone_north' },
    { from: 'south_concourse', to: 'east_concourse', distance: 190, accessible: true, baseTime: 3, zoneId: 'zone_south' },
    { from: 'east_concourse', to: 'south_concourse', distance: 190, accessible: true, baseTime: 3, zoneId: 'zone_south' },
    { from: 'north_concourse', to: 'south_concourse', distance: 400, accessible: true, baseTime: 8, zoneId: 'zone_north' },
    { from: 'south_concourse', to: 'north_concourse', distance: 400, accessible: true, baseTime: 8, zoneId: 'zone_north' },
    // Transit links
    { from: 'gate_a', to: 'transit_link_a', distance: 350, accessible: true, baseTime: 7, zoneId: 'zone_exterior' },
    { from: 'transit_link_a', to: 'gate_a', distance: 350, accessible: true, baseTime: 7, zoneId: 'zone_exterior' },
    { from: 'gate_c', to: 'transit_link_b', distance: 300, accessible: true, baseTime: 5, zoneId: 'zone_exterior' },
    { from: 'transit_link_b', to: 'gate_c', distance: 300, accessible: true, baseTime: 5, zoneId: 'zone_exterior' },
    { from: 'gate_d', to: 'transit_link_b', distance: 250, accessible: true, baseTime: 4, zoneId: 'zone_exterior' },
    { from: 'transit_link_b', to: 'gate_d', distance: 250, accessible: true, baseTime: 4, zoneId: 'zone_exterior' },
    // Amenities
    { from: 'north_concourse', to: 'refill_point_a', distance: 50, accessible: true, baseTime: 1, zoneId: 'zone_north' },
    { from: 'refill_point_a', to: 'north_concourse', distance: 50, accessible: true, baseTime: 1, zoneId: 'zone_north' },
    { from: 'south_concourse', to: 'refill_point_b', distance: 60, accessible: true, baseTime: 1, zoneId: 'zone_south' },
    { from: 'refill_point_b', to: 'south_concourse', distance: 60, accessible: true, baseTime: 1, zoneId: 'zone_south' },
    { from: 'north_concourse', to: 'restroom_north', distance: 40, accessible: true, baseTime: 1, zoneId: 'zone_north' },
    { from: 'restroom_north', to: 'north_concourse', distance: 40, accessible: true, baseTime: 1, zoneId: 'zone_north' },
    { from: 'south_concourse', to: 'restroom_south', distance: 40, accessible: true, baseTime: 1, zoneId: 'zone_south' },
    { from: 'restroom_south', to: 'south_concourse', distance: 40, accessible: true, baseTime: 1, zoneId: 'zone_south' },
    { from: 'east_concourse', to: 'food_court', distance: 70, accessible: true, baseTime: 1, zoneId: 'zone_east' },
    { from: 'food_court', to: 'east_concourse', distance: 70, accessible: true, baseTime: 1, zoneId: 'zone_east' },
    { from: 'north_concourse', to: 'first_aid', distance: 80, accessible: true, baseTime: 1, zoneId: 'zone_north' },
    { from: 'first_aid', to: 'north_concourse', distance: 80, accessible: true, baseTime: 1, zoneId: 'zone_north' },
  ],
};

/** Zone definitions with accessibility features */
const zones = [
  { zoneId: 'zone_north', name: 'North Concourse', type: 'concourse', capacity: 5000, amenities: ['refill_point_a', 'restroom_north', 'first_aid'], accessibilityFeatures: ['elevators', 'ramps', 'tactile_paving'] },
  { zoneId: 'zone_south', name: 'South Concourse', type: 'concourse', capacity: 4500, amenities: ['refill_point_b', 'restroom_south'], accessibilityFeatures: ['elevators', 'ramps'] },
  { zoneId: 'zone_east', name: 'East Concourse', type: 'concourse', capacity: 4000, amenities: ['food_court'], accessibilityFeatures: ['ramps', 'wide_corridors'] },
  { zoneId: 'zone_exterior', name: 'Exterior Plaza', type: 'plaza', capacity: 15000, amenities: [], accessibilityFeatures: ['smooth_paving', 'curb_cuts'] },
];

/** Simulated live telemetry with realistic values */
const telemetry = [
  { zoneId: 'zone_north', densityPercent: 72, queueLength: 45, waitTimeMinutes: 8, incidentFlag: false, trend: 'increasing' },
  { zoneId: 'zone_south', densityPercent: 35, queueLength: 12, waitTimeMinutes: 2, incidentFlag: false, trend: 'stable' },
  { zoneId: 'zone_east', densityPercent: 55, queueLength: 28, waitTimeMinutes: 5, incidentFlag: false, trend: 'increasing' },
  { zoneId: 'zone_exterior', densityPercent: 20, queueLength: 5, waitTimeMinutes: 1, incidentFlag: false, trend: 'decreasing' },
];

/** Transport load data */
const transport = {
  shuttleLoad: 60,
  trainLoad: 80,
  parkingLoad: 95,
  transitLinks: ['transit_link_a', 'transit_link_b'],
  recommendedDepartureWindow: '22:00 - 23:00',
};

/** Active incidents */
const incidents = [
  {
    scenario: 'gate_closure',
    affectedZone: 'zone_north',
    severity: 'high',
    operationalImpact: 'Gate B closed. Reroute via Gate A.',
    recommendedAction: 'open_lane',
  },
];

/** Sustainability metrics */
const sustainability = {
  binFillPercent: { zone_north: 45, zone_south: 30, zone_east: 55, zone_exterior: 20 },
  waterRefillAvailability: { refill_point_a: 'operational', refill_point_b: 'operational' },
  energyLoad: 75,
  transitShare: 68,
  sustainabilityScore: 85,
};

/** FAQ knowledge base */
const faqs = {
  'gate guidance': 'All gates open 3 hours before kickoff. Gate A and C offer wheelchair-accessible entry.',
  'restroom guidance': 'Restrooms are located in all concourses. Accessible restrooms are available at North and South Concourse.',
  'accessibility support': 'Accessibility staff are located near all major entrances. Wheelchair assistance is available at Gate A and Gate D.',
  'water refill': 'Free water refill stations are available at North and South Concourse. Bring your reusable bottle!',
  'food and drinks': 'The main Food Court is in the East Concourse, offering diverse cuisines and allergen-friendly options.',
  'first aid': 'The First Aid Station is located in the North Concourse. Call stadium hotline for emergencies.',
  'transit': 'Transit Link A (Metro) is accessible from Gate A. Transit Link B (Bus) is accessible from Gate C and Gate D.',
};

// Write all data files
const files = {
  'stadium_graph.json': stadiumGraph,
  'zones.json': zones,
  'sample_telemetry.json': telemetry,
  'transport.json': transport,
  'incidents.json': incidents,
  'sustainability.json': sustainability,
  'faqs.json': faqs,
};

for (const [filename, data] of Object.entries(files)) {
  fs.writeFileSync(path.join(dataDir, filename), JSON.stringify(data, null, 2));
}

console.log(`✅ Generated ${Object.keys(files).length} synthetic data files in data/`);
console.log(`   Nodes: ${stadiumGraph.nodes.length}, Edges: ${stadiumGraph.edges.length}`);
console.log(`   Zones: ${zones.length}, Telemetry points: ${telemetry.length}`);
