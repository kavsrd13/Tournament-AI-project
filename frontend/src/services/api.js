/**
 * @module api
 * @description Typed-at-the-boundary API helpers. UI components receive parsed
 * data or a consistent ApiError and do not duplicate fetch boilerplate.
 */
const API_BASE = import.meta.env.VITE_API_URL || '';

export class ApiError extends Error {
  constructor(message, status, details = []) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });

  let payload = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    throw new ApiError(
      payload?.error || `Request failed with HTTP ${response.status}`,
      response.status,
      payload?.details || [],
    );
  }

  return payload;
}

export function getSnapshot(signal) {
  return requestJson('/api/snapshot', { signal });
}

export function sendAssistantMessage(payload, signal) {
  return requestJson('/api/assistant', {
    method: 'POST',
    signal,
    body: JSON.stringify(payload),
  });
}

export function simulateIncident(payload) {
  return requestJson('/api/simulate/incident', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function approveOperatorAction(payload) {
  return requestJson('/api/operator/action', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
