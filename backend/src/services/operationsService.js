/**
 * @module operationsService
 * @description Business rules for operator-approved actions and demo incident
 * simulation. API routes should translate HTTP requests, not own these rules.
 */
const { ACTION_TYPES, INCIDENT_SCENARIOS } = require('../constants');
const { getZones, addIncident, resolveIncidentByAction } = require('./dataLoader');

function isKnownZone(zoneId) {
  return getZones().some((zone) => zone.zoneId === zoneId);
}

function createAuditRecord(actionType, zoneId, approvedBy, executedAt) {
  return {
    action: actionType,
    zone: zoneId,
    operator: approvedBy,
    executedAt,
    source: 'human_approved',
  };
}

function executeApprovedAction({ actionType, zoneId, approvedBy, now = new Date() }) {
  if (!ACTION_TYPES.includes(actionType)) throw new Error('Invalid action type');
  if (!isKnownZone(zoneId)) throw new Error('Zone does not exist in the stadium map.');

  const executedAt = now.toISOString();
  resolveIncidentByAction(actionType, zoneId);
  return {
    status: 'success',
    actionType,
    zoneId,
    approvedBy,
    timestamp: executedAt,
    audit: createAuditRecord(actionType, zoneId, approvedBy, executedAt),
  };
}

function simulateIncident({ scenario, zoneId, now = new Date() }) {
  if (!INCIDENT_SCENARIOS.includes(scenario)) throw new Error('Invalid incident scenario');
  if (!isKnownZone(zoneId)) throw new Error('Zone does not exist in the stadium map.');

  addIncident({
    scenario,
    affectedZone: zoneId,
    severity: 'high',
    operationalImpact: `Simulated impact for ${scenario}. Rerouting recommended.`,
    recommendedAction: 'open_lane',
  });

  return {
    status: 'simulated',
    scenario,
    zoneId,
    updatedRiskScore: 'high',
    timestamp: now.toISOString(),
    recommendedActions: [
      { action: 'dispatch_volunteers', priority: 'high' },
      { action: 'reroute_traffic', priority: 'medium' },
    ],
  };
}

module.exports = { isKnownZone, executeApprovedAction, simulateIncident };
