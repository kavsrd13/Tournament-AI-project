/**
 * @module validators
 * @description Zod-based request validation middleware.
 * Provides schemas for all API endpoints and a reusable
 * `validate()` middleware factory for Express routes.
 */
const { z } = require('zod');

// ─── Shared Patterns ────────────────────────────────────────────────

/** Valid zone ID pattern */
const zoneIdPattern = /^zone_[a-z_]+$/;

/** Valid node ID pattern (matches graph node IDs like gate_a, section_104) */
const nodeIdPattern = /^[a-z_0-9]+$/;

// ─── Schemas ────────────────────────────────────────────────────────

/**
 * Schema for POST /api/assistant
 * Validates fan/operator chat requests with input length limits
 * and persona whitelisting.
 */
const AssistantRequestSchema = z.object({
  persona: z.enum(['fan', 'operator'], {
    errorMap: () => ({ message: 'Persona must be "fan" or "operator"' }),
  }),
  language: z
    .enum(['en', 'es', 'fr', 'de', 'pt', 'ar', 'ja', 'ko', 'zh'], {
      errorMap: () => ({ message: 'Unsupported language code' }),
    })
    .default('en'),
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(500, 'Message must be 500 characters or less')
    .transform((val) => sanitizeInput(val)),
  context: z.record(z.unknown()).default({}),
});

/**
 * Schema for POST /api/operator/action
 * Ensures human-in-the-loop approval is always present.
 */
const OperatorActionSchema = z.object({
  actionType: z.enum(
    ['open_lane', 'close_gate', 'dispatch_volunteers', 'reroute_traffic', 'escalate'],
    { errorMap: () => ({ message: 'Invalid action type' }) }
  ),
  zoneId: z
    .string()
    .regex(zoneIdPattern, 'Zone ID must match pattern zone_<name>'),
  approvedBy: z
    .string()
    .min(1, 'Human approval (approvedBy) is required')
    .max(100, 'Approver name must be 100 characters or less'),
});

/**
 * Schema for POST /api/simulate/incident
 */
const IncidentSchema = z.object({
  scenario: z.enum(
    ['gate_closure', 'crowd_surge', 'medical_emergency', 'power_outage', 'weather_delay'],
    { errorMap: () => ({ message: 'Invalid incident scenario' }) }
  ),
  zoneId: z
    .string()
    .regex(zoneIdPattern, 'Zone ID must match pattern zone_<name>'),
});

/**
 * Schema for GET /api/routes query params
 */
const RouteQuerySchema = z.object({
  from: z
    .string()
    .regex(nodeIdPattern, 'Invalid node ID format for "from"'),
  to: z
    .string()
    .regex(nodeIdPattern, 'Invalid node ID format for "to"'),
  accessibility: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
  avoidCrowds: z
    .enum(['true', 'false'])
    .default('false')
    .transform((val) => val === 'true'),
});

// ─── Sanitization ───────────────────────────────────────────────────

/**
 * Strips known prompt-injection patterns and dangerous characters
 * from user-supplied text.
 * @param {string} input - Raw user input
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return '';

  return input
    // Strip potential prompt injection markers
    .replace(/\b(SYSTEM|ASSISTANT|INSTRUCTION|IGNORE PREVIOUS|DISREGARD)\b:?/gi, '')
    // Strip HTML/script tags
    .replace(/<[^>]*>/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// ─── Middleware Factory ─────────────────────────────────────────────

/**
 * Creates Express middleware that validates the request body or query
 * against a Zod schema.
 *
 * @param {z.ZodSchema} schema - Zod schema to validate against
 * @param {'body'|'query'} source - Whether to validate req.body or req.query
 * @returns {Function} Express middleware function
 *
 * @example
 * router.post('/assistant', validate(AssistantRequestSchema), handler);
 * router.get('/routes', validate(RouteQuerySchema, 'query'), handler);
 */
function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }));

      return res.status(400).json({
        error: 'Validation failed',
        details: errors,
      });
    }

    // Replace raw input with validated/transformed data
    req[source] = result.data;
    next();
  };
}

module.exports = {
  AssistantRequestSchema,
  OperatorActionSchema,
  IncidentSchema,
  RouteQuerySchema,
  validate,
  sanitizeInput,
};
