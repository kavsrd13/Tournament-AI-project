/**
 * @module apiRoutes
 * @description Express router for all TournamentPulse AI API endpoints.
 * Uses Zod validation middleware and centralized data loader.
 */
const express = require('express');
const router = express.Router();
const { findShortestPath } = require('../services/routingService');
const { generateAssistantResponse } = require('../services/assistantService');
const {
  getZones,
  getTelemetry,
  getIncidents,
  getSustainability,
  addIncident,
  resolveIncidentByAction,
} = require('../services/dataLoader');
const {
  validate,
  AssistantRequestSchema,
  OperatorActionSchema,
  IncidentSchema,
  RouteQuerySchema,
} = require('../middleware/validators');

/**
 * GET /api/snapshot
 * Returns a combined view of all stadium operational data.
 * Used by the Operator Dashboard for live telemetry.
 */
router.get('/snapshot', (req, res) => {
  res.json({
    zones: getZones(),
    telemetry: getTelemetry(),
    incidents: getIncidents(),
    sustainability: getSustainability(),
  });
});

/**
 * GET /api/routes
 * Computes congestion-aware, accessibility-aware routing between two
 * stadium nodes using Dijkstra's algorithm.
 *
 * @query {string} from - Source node ID
 * @query {string} to - Destination node ID
 * @query {string} [accessibility=false] - Require accessible paths
 * @query {string} [avoidCrowds=false] - Apply congestion penalties
 */
router.get('/routes', validate(RouteQuerySchema, 'query'), (req, res) => {
  const { from, to, accessibility, avoidCrowds } = req.query;
  const route = findShortestPath(from, to, avoidCrowds, accessibility);
  res.json(route);
});

/**
 * POST /api/assistant
 * Sends a user message to the AI assistant with persona and context.
 * Returns a structured JSON response with recommendations.
 *
 * @body {string} persona - "fan" or "operator"
 * @body {string} [language="en"] - Language code
 * @body {string} message - User's message (max 500 chars)
 * @body {object} [context={}] - Additional context
 */
router.post('/assistant', validate(AssistantRequestSchema), async (req, res, next) => {
  try {
    const { persona, language, message, context } = req.body;
    const response = await generateAssistantResponse(persona, language, message, context);
    res.json(response);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/operator/action
 * Executes an operator-approved action. Requires human-in-the-loop
 * approval (approvedBy field) to prevent autonomous AI actions.
 *
 * @body {string} actionType - Type of action to execute
 * @body {string} zoneId - Target zone
 * @body {string} approvedBy - Name of the approving operator
 */
router.post('/operator/action', validate(OperatorActionSchema), (req, res) => {
  const { actionType, zoneId, approvedBy } = req.body;
  resolveIncidentByAction(actionType, zoneId);
  res.json({
    status: 'success',
    actionType,
    zoneId,
    approvedBy,
    timestamp: new Date().toISOString(),
    audit: {
      action: actionType,
      zone: zoneId,
      operator: approvedBy,
      executedAt: new Date().toISOString(),
      source: 'human_approved',
    },
  });
});

/**
 * POST /api/simulate/incident
 * Simulates an incident for testing and demo purposes.
 * Returns the simulated incident with an updated risk score.
 *
 * @body {string} scenario - Incident scenario type
 * @body {string} zoneId - Affected zone
 */
router.post('/simulate/incident', validate(IncidentSchema), (req, res) => {
  const { scenario, zoneId } = req.body;
  
  const incident = {
    scenario,
    affectedZone: zoneId,
    severity: 'high',
    operationalImpact: `Simulated impact for ${scenario}. Rerouting recommended.`,
    recommendedAction: 'open_lane',
  };
  addIncident(incident);

  res.json({
    status: 'simulated',
    scenario,
    zoneId,
    updatedRiskScore: 'high',
    timestamp: new Date().toISOString(),
    recommendedActions: [
      { action: 'dispatch_volunteers', priority: 'high' },
      { action: 'reroute_traffic', priority: 'medium' },
    ],
  });
});

module.exports = router;
