/**
 * @module config
 * @description Validated runtime configuration. Keeping environment parsing in
 * one module prevents inconsistent defaults across the server.
 */
require('dotenv').config();

function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

const allowedOrigins = (process.env.FRONTEND_URL || 'http://localhost:5173')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

module.exports = Object.freeze({
  port: positiveInteger(process.env.PORT, 4000),
  nodeEnv: process.env.NODE_ENV || 'development',
  aiApiKey: process.env.AI_API_KEY || '',
  aiModel: process.env.AI_MODEL || 'gemini-2.0-flash',
  allowedOrigins: new Set(allowedOrigins),
  assistantRateLimitPerMinute: positiveInteger(process.env.ASSISTANT_RATE_LIMIT_PER_MINUTE, 100),
  jsonBodyLimit: '10kb',
});
