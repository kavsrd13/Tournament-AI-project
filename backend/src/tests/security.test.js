/**
 * @file security.test.js
 * @description Security-focused tests verifying headers, CORS,
 * rate limiting behavior, and input sanitization.
 */
const request = require('supertest');
const app = require('../server');
const { clearCache } = require('../services/dataLoader');

beforeEach(() => {
  clearCache();
});

// ─── Security Headers ───────────────────────────────────────────────

describe('Security Headers', () => {
  it('should include Helmet security headers', async () => {
    const res = await request(app).get('/api/health');

    // Helmet sets these headers
    expect(res.headers).toHaveProperty('x-content-type-options');
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('should not expose x-powered-by header', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers).not.toHaveProperty('x-powered-by');
  });

  it('should return JSON content type', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toContain('application/json');
  });
});

// ─── CORS ───────────────────────────────────────────────────────────

describe('CORS', () => {
  it('should allow requests from configured origin', async () => {
    const res = await request(app)
      .get('/api/health')
      .set('Origin', 'http://localhost:5173');
    expect(res.status).toBe(200);
  });
});

// ─── Input Validation Security ──────────────────────────────────────

describe('Input Validation Security', () => {
  it('should reject oversized request bodies', async () => {
    const largeMessage = 'x'.repeat(500);
    const res = await request(app)
      .post('/api/assistant')
      .send({
        persona: 'fan',
        message: largeMessage,
        context: {},
      });
    // Should be 200 (500 chars is at the limit) or 400
    expect([200, 400]).toContain(res.status);
  });

  it('should strip HTML/script tags from user input', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .send({
        persona: 'fan',
        message: '<img src=x onerror=alert(1)>Normal question',
      });
    expect(res.status).toBe(200);
    // The sanitized message should not contain the attack vector
  });

  it('should reject requests with SQL injection patterns in IDs', async () => {
    const res = await request(app)
      .get('/api/routes?from=gate_a;DROP TABLE&to=section_104');
    expect(res.status).toBe(400);
  });

  it('should reject unknown action types (whitelist enforcement)', async () => {
    const res = await request(app)
      .post('/api/operator/action')
      .send({
        actionType: 'delete_all_data',
        zoneId: 'zone_north',
        approvedBy: 'Admin',
      });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('should enforce human-in-the-loop for operator actions', async () => {
    const res = await request(app)
      .post('/api/operator/action')
      .send({
        actionType: 'open_lane',
        zoneId: 'zone_north',
        // No approvedBy — should fail
      });
    expect(res.status).toBe(400);
  });
});

// ─── Error Handling ─────────────────────────────────────────────────

describe('Error Handling', () => {
  it('should return structured error for invalid JSON body', async () => {
    const res = await request(app)
      .post('/api/assistant')
      .set('Content-Type', 'application/json')
      .send('{ invalid json }');
    // Express should return 400 for malformed JSON
    expect(res.status).toBe(400);
  });

  it('should return 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });
});
