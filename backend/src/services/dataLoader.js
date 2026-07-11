/**
 * @module dataLoader
 * @description Centralized data access layer. Loads all JSON data files once
 * at startup and provides getter functions. This eliminates per-request
 * synchronous file I/O and makes data access mockable for tests.
 */
const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '../../../data');

/** @type {Map<string, object>} In-memory cache of parsed JSON data */
const cache = new Map();

/**
 * Loads a JSON file from the data directory into memory.
 * Reads from cache on subsequent calls.
 * @param {string} filename - Name of the JSON file (e.g., 'zones.json')
 * @returns {object} Parsed JSON data
 * @throws {Error} If the file does not exist or contains invalid JSON
 */
function loadData(filename) {
  if (cache.has(filename)) {
    return cache.get(filename);
  }
  const filePath = path.join(dataDir, filename);
  const raw = fs.readFileSync(filePath, 'utf-8');
  const parsed = JSON.parse(raw);
  cache.set(filename, parsed);
  return parsed;
}

/**
 * Forces a reload of a specific data file from disk.
 * Useful for testing or when data files are updated at runtime.
 * @param {string} filename - Name of the JSON file to reload
 * @returns {object} Freshly parsed JSON data
 */
function reloadData(filename) {
  cache.delete(filename);
  return loadData(filename);
}

/**
 * Clears the entire data cache. Primarily used in tests.
 */
function clearCache() {
  cache.clear();
}

/** @returns {object} Stadium graph with nodes and edges */
const getStadiumGraph = () => loadData('stadium_graph.json');

/** @returns {Array} Array of zone objects */
const getZones = () => loadData('zones.json');

/** @returns {Array} Array of telemetry readings per zone */
const getTelemetry = () => loadData('sample_telemetry.json');

/** @returns {Array} Array of active incident objects */
const getIncidents = () => loadData('incidents.json');

/** @returns {object} Sustainability metrics */
const getSustainability = () => loadData('sustainability.json');

/** @returns {object} Transport load data */
const getTransport = () => loadData('transport.json');

/** @returns {object} FAQ entries */
const getFaqs = () => loadData('faqs.json');

/** Adds an incident to the active list */
function addIncident(incident) {
  const incidents = getIncidents();
  incidents.push(incident);
}

/** Resolves an incident based on action type and zone */
function resolveIncidentByAction(actionType, zoneId) {
  const incidents = getIncidents();
  const index = incidents.findIndex(i => i.recommendedAction === actionType && i.affectedZone === zoneId);
  if (index !== -1) {
    incidents.splice(index, 1);
  }
}

module.exports = {
  loadData,
  reloadData,
  clearCache,
  getStadiumGraph,
  getZones,
  getTelemetry,
  getIncidents,
  getSustainability,
  getTransport,
  getFaqs,
  addIncident,
  resolveIncidentByAction,
};
