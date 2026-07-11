/**
 * @module assistantLogic
 * @description Deterministic, data-grounded decision layer used by the
 * assistant when an AI provider is unavailable and as a safe fallback when
 * a provider returns an unusable response.
 */
const {
  getStadiumGraph,
  getTelemetry,
  getIncidents,
  getFaqs,
} = require('./dataLoader');
const { findShortestPath } = require('./routingService');

const DEFAULT_START_NODE = 'gate_a';

const DESTINATIONS = [
  { node: 'restroom_north', pattern: /restroom|bathroom|toilet/ },
  { node: 'refill_point_a', pattern: /water|refill|hydration/ },
  { node: 'food_court', pattern: /food|restaurant|eat|meal/ },
  { node: 'first_aid', pattern: /first aid|medical|medic|injur|doctor/ },
  { node: 'transit_link_a', pattern: /transit|metro|train|bus|transport/ },
  { node: 'section_104', pattern: /section\s*104|block\s*104/ },
  { node: 'section_210', pattern: /section\s*210|block\s*210/ },
  { node: 'section_315', pattern: /section\s*315|block\s*315/ },
  { node: 'gate_a', pattern: /gate\s*a/ },
  { node: 'gate_b', pattern: /gate\s*b/ },
  { node: 'gate_c', pattern: /gate\s*c/ },
  { node: 'gate_d', pattern: /gate\s*d/ },
];

function getNodeName(nodeId) {
  const node = getStadiumGraph().nodes.find((candidate) => candidate.id === nodeId);
  return node ? node.name : nodeId.replace(/_/g, ' ');
}

function getDestination(message) {
  return DESTINATIONS.find(({ pattern }) => pattern.test(message))?.node;
}

function chooseAmenity(message, startNode, accessibilityMode) {
  const candidates = message.match(/restroom|bathroom|toilet/)
    ? ['restroom_north', 'restroom_south']
    : message.match(/water|refill|hydration/)
      ? ['refill_point_a', 'refill_point_b']
      : null;

  if (!candidates) return getDestination(message);

  return candidates
    .map((node) => ({
      node,
      route: findShortestPath(startNode, node, true, accessibilityMode),
    }))
    .filter(({ route }) => route.path.length > 0)
    .sort((a, b) => a.route.estimatedTimeMinutes - b.route.estimatedTimeMinutes)[0]?.node;
}

function routeResponse(message, context) {
  const accessibilityMode = context.accessibilityMode === true;
  const startNode = context.currentNode || DEFAULT_START_NODE;
  const destination = chooseAmenity(message, startNode, accessibilityMode);

  if (!destination) {
    return null;
  }

  const route = findShortestPath(startNode, destination, true, accessibilityMode);
  if (!route.path.length) {
    return {
      summary: `I couldn't find a ${accessibilityMode ? 'fully accessible ' : ''}route from ${getNodeName(startNode)} to ${getNodeName(destination)}.`,
      recommended_action: 'Ask a stadium steward for live assistance.',
      reason: route.reason,
      priority: 'medium',
      accessibility_notes: accessibilityMode ? 'No accessible route is available in the current map.' : 'A steward can confirm the safest alternative.',
      handoff_required: true,
      source: 'local-stadium-logic',
    };
  }

  const routeNames = route.path.map(getNodeName).join(' → ');
  return {
    summary: `${getNodeName(destination)} is about ${route.estimatedTimeMinutes} minutes from ${getNodeName(startNode)} via ${routeNames}.`,
    recommended_action: accessibilityMode
      ? 'Follow the accessible route and use the marked elevators or ramps.'
      : 'Follow the route shown and keep to the signed concourse flow.',
    reason: `${route.reason} Current crowd level is ${route.crowdLevel}.`,
    priority: route.crowdLevel === 'high' ? 'high' : 'low',
    accessibility_notes: route.accessibilityNotes,
    handoff_required: false,
    source: 'local-stadium-logic',
    route: {
      path: route.path,
      distanceMeters: route.totalDistance,
      estimatedTimeMinutes: route.estimatedTimeMinutes,
      crowdLevel: route.crowdLevel,
    },
  };
}

function fanResponse(message, context) {
  const route = routeResponse(message, context);
  if (route) return route;

  const faqs = getFaqs();
  if (/gate|entry|entrance|kickoff/.test(message)) {
    return {
      summary: faqs['gate guidance'] || 'All gates open three hours before kickoff.',
      recommended_action: 'Share your gate letter or section number for a turn-by-turn route.',
      reason: 'Gate guidance is based on the stadium event information service.',
      priority: 'low',
      accessibility_notes: 'Accessibility staff are available near major entrances.',
      handoff_required: false,
      source: 'local-stadium-logic',
    };
  }

  if (/accessible|wheelchair|mobility|elevator|ramp/.test(message)) {
    return {
      summary: faqs['accessibility support'] || 'Accessibility staff are located near all major entrances.',
      recommended_action: 'Turn on Accessible Route, then tell me your destination.',
      reason: 'The route engine will exclude stair-only segments when accessible routing is enabled.',
      priority: 'low',
      accessibility_notes: 'Elevators, ramps, tactile paving, and curb cuts are included in the venue map.',
      handoff_required: false,
      source: 'local-stadium-logic',
    };
  }

  if (/emergency|unsafe|lost|help/.test(message)) {
    return {
      summary: 'For an urgent safety issue, contact the nearest steward or venue emergency point immediately.',
      recommended_action: 'Go to First Aid or ask a steward to call stadium control.',
      reason: 'Safety requests should be handled by trained on-site staff.',
      priority: 'critical',
      accessibility_notes: 'Ask for accessible assistance if you need an elevator, ramp, or mobility support.',
      handoff_required: true,
      source: 'local-stadium-logic',
    };
  }

  return {
    summary: 'I can help you find a gate, section, restroom, water refill point, food court, first aid, or transit link.',
    recommended_action: 'Tell me your destination and, if useful, your current gate or concourse.',
    reason: 'The assistant uses the stadium map and current telemetry to select a route.',
    priority: 'low',
    accessibility_notes: 'Enable Accessible Route for elevator- and ramp-aware guidance.',
    handoff_required: false,
    source: 'local-stadium-logic',
  };
}

function operatorResponse(message) {
  const telemetry = getTelemetry();
  const incidents = getIncidents();
  const highestDensity = [...telemetry].sort((a, b) => b.densityPercent - a.densityPercent)[0];

  if (/incident|alert|risk|emergency|closure/.test(message) && incidents.length > 0) {
    const incident = incidents[0];
    return {
      summary: `${incidents.length} active incident${incidents.length === 1 ? '' : 's'}: ${incident.scenario.replace(/_/g, ' ')} in ${incident.affectedZone}.`,
      recommended_action: `Review and approve ${incident.recommendedAction.replace(/_/g, ' ')} for ${incident.affectedZone}.`,
      reason: `${incident.operationalImpact} Human approval is required before any operational action is executed.`,
      priority: incident.severity || 'high',
      accessibility_notes: 'Keep accessible routes open during any crowd diversion.',
      handoff_required: false,
      source: 'local-stadium-logic',
    };
  }

  const queueSummary = telemetry
    .sort((a, b) => b.densityPercent - a.densityPercent)
    .slice(0, 2)
    .map((zone) => `${zone.zoneId} ${zone.densityPercent}% density / ${zone.queueLength} queued`)
    .join('; ');

  return {
    summary: `Highest pressure is ${highestDensity.zoneId} at ${highestDensity.densityPercent}% density with a ${highestDensity.waitTimeMinutes}-minute wait.`,
    recommended_action: 'Monitor the highest-pressure zone and prepare a reversible crowd-management response.',
    reason: `Telemetry snapshot: ${queueSummary}. Recommendations are advisory and require operator approval.`,
    priority: highestDensity.densityPercent >= 70 ? 'high' : 'medium',
    accessibility_notes: 'Check that diversions preserve step-free access and do not block assistance points.',
    handoff_required: false,
    source: 'local-stadium-logic',
  };
}

function generateRuleBasedResponse(persona, message, context = {}) {
  return persona === 'operator' ? operatorResponse(message.toLowerCase()) : fanResponse(message.toLowerCase(), context);
}

module.exports = { generateRuleBasedResponse };
