/** @module constants */

const ACTION_TYPES = Object.freeze([
  'open_lane',
  'close_gate',
  'dispatch_volunteers',
  'reroute_traffic',
  'escalate',
]);

const INCIDENT_SCENARIOS = Object.freeze([
  'gate_closure',
  'crowd_surge',
  'medical_emergency',
  'power_outage',
  'weather_delay',
]);

const LANGUAGES = Object.freeze(['en', 'es', 'fr', 'de', 'pt', 'ar', 'ja', 'ko', 'zh']);
const PERSONAS = Object.freeze(['fan', 'operator']);

module.exports = { ACTION_TYPES, INCIDENT_SCENARIOS, LANGUAGES, PERSONAS };
