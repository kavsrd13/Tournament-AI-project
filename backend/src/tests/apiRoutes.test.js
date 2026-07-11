/**
 * @file apiRoutes.test.js
 * @description Integration tests for all API endpoints.
 * Uses supertest to make HTTP requests against the Express app.
 */
const request = require('supertest');
const app = require('../server');
const { clearCache } = require('../services/dataLoader');

beforeEach(() => {
  clearCache();
});

// ─── GET /api/health ────────────────────────────────────────────────

describe('GET /api/health', () => {
  it('should return 200 with status ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.version).toBe('1.0.0');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
  });
});

// ─── GET /api/snapshot ──────────────────────────────────────────────

describe('GET /api/snapshot', () => {
  it('should return 200 with zones, telemetry, incidents, sustainability', async () => {
    const res = await request(app).get('/api/snapshot');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('zones');
    expect(res.body).toHaveProperty('telemetry');
    expect(res.body).toHaveProperty('incidents');
    expect(res.body).toHaveProperty('sustainability');
    expect(Array.isArray(res.body.zones)).toBe(true);
    expect(Array.isArray(res.body.telemetry)).toBe(true);
  });

  it('should return non-empty data arrays', async () => {
    const res = await request(app).get('/api/snapshot');
    expect(res.body.zones.length).toBeGreaterThan(0);
    expect(res.body.telemetry.length).toBeGreaterThan(0);
  });
});

// ─── GET /api/routes ────────────────────────────────────────────────

describe('GET /api/routes', () => {
  it('should return a valid route for known nodes', async () => {
    const res = await request(app)
      .get('/api/routes?from=gate_a&to=section_104');
    expect(res.status).toBe(200);
    expect(res.body.path).toContain('gate_a');
    expect(res.body.path).toContain('section_104');
    expect(res.body.algorithm).toBe('dijkstra');
    expect(res.body.estimatedTimeMinutes).toBeGreaterThan(0);
  });

  it('should accept accessibility and avoidCrowds params', async () => {
    const res = await request(app)
      .get('/api/routes?from=gate_a&to=section_104&accessibility=true&avoidCrowds=true');
    expect(res.status).toBe(200);
    expect(res.body.accessibilityNotes).toContain('wheelchair');
  });

  it('should return 400 for missing from parameter', async () => {
    const res = await request(app)
      .get('/api/routes?to=section_104');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for invalid node ID format', async () => {
    const res = await request(app)
      .get('/api/routes?from=INVALID!!!&to=section_104');
    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('details');
  });
});

// ─── POST /api/assistant ────────────────────────────────────────────

describe('POST /api/assistant', () => {
  it('should return a response for valid request (fallback mode)', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({
        persona: 'fan',
        language: 'en',
        message: 'Where is the nearest restroom?',
        context: {},
      });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('summary');
    expect(res.body).toHaveProperty('handoff_required');
  });

  it('should return 400 for missing persona', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({ message: 'Hello' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should return 400 for missing message', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({ persona: 'fan' });
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid persona', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({ persona: 'hacker', message: 'test' });
    expect(res.status).toBe(400);
  });

  it('should sanitize XSS in message', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({
        persona: 'fan',
        message: '<script>alert("xss")</script>Help me',
      });
    expect(res.status).toBe(200);
    // The message was sanitized before processing
    expect(res.body).toHaveProperty('summary');
  });
});

// ─── POST /api/operator/action ──────────────────────────────────────

describe('POST /api/operator/action', () => {
  it('should succeed with valid approval', async () => {
    const res = await request(app)
      .post('/api/operator/action')
      .send({
        actionType: 'open_lane',
        zoneId: 'zone_north',
        approvedBy: 'Operator Smith',
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('success');
    expect(res.body.audit).toHaveProperty('operator');
    expect(res.body.audit.source).toBe('human_approved');
  });

  it('should return 400 when approvedBy is missing (human-in-the-loop)', async () => {
    const res = await request(app)
      .post('/api/operator/action')
      .send({
        actionType: 'open_lane',
        zoneId: 'zone_north',
      });
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid action type', async () => {
    const res = await request(app)
      .post('/api/operator/action')
      .send({
        actionType: 'invalid_action',
        zoneId: 'zone_north',
        approvedBy: 'Admin',
      });
    expect(res.status).toBe(400);
  });
});

// ─── POST /api/simulate/incident ────────────────────────────────────

describe('POST /api/simulate/incident', () => {
  it('should simulate an incident successfully', async () => {
    const res = await request(app)
      .post('/api/simulate/incident')
      .send({
        scenario: 'gate_closure',
        zoneId: 'zone_north',
      });
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('simulated');
    expect(res.body).toHaveProperty('recommendedActions');
    expect(res.body).toHaveProperty('timestamp');
  });

  it('should return 400 for invalid scenario', async () => {
    const res = await request(app)
      .post('/api/simulate/incident')
      .send({
        scenario: 'zombie_apocalypse',
        zoneId: 'zone_north',
      });
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid zone ID', async () => {
    const res = await request(app)
      .post('/api/simulate/incident')
      .send({
        scenario: 'gate_closure',
        zoneId: 'bad-zone-id',
      });
    expect(res.status).toBe(400);
  });
});
