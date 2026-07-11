/**
 * @file assistantService.test.js
 * @description Unit tests for the AI assistant service.
 * Tests fallback behavior, response schema validation,
 * and error handling without requiring a real API key.
 */
const { generateAssistantResponse, AIResponseSchema, FALLBACK_RESPONSE } = require('../services/assistantService');

// ─── Fallback Mode Tests ────────────────────────────────────────────

describe('AssistantService - Fallback Mode', () => {
  beforeEach(() => {
    // Ensure no API key is set for fallback tests
    delete process.env.AI_API_KEY;
  });

  it('should return fallback response when no API key is configured', async () => {
    const result = await generateAssistantResponse('fan', 'en', 'Find my gate', {});

    expect(result.summary).toBeTruthy();
    expect(result.handoff_required).toBe(true);
    expect(result.reason).toContain('No AI API key');
    expect(result.priority).toBe('low');
  });

  it('should include all required fields in fallback response', async () => {
    const result = await generateAssistantResponse('operator', 'es', 'Status update', {});

    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('recommended_action');
    expect(result).toHaveProperty('reason');
    expect(result).toHaveProperty('priority');
    expect(result).toHaveProperty('accessibility_notes');
    expect(result).toHaveProperty('handoff_required');
  });

  it('should work with different personas in fallback', async () => {
    const fanResult = await generateAssistantResponse('fan', 'en', 'Help', {});
    const opResult = await generateAssistantResponse('operator', 'en', 'Help', {});

    // Both should return fallback since no API key
    expect(fanResult.handoff_required).toBe(true);
    expect(opResult.handoff_required).toBe(true);
  });

  it('should work with different languages in fallback', async () => {
    const enResult = await generateAssistantResponse('fan', 'en', 'Hello', {});
    const esResult = await generateAssistantResponse('fan', 'es', 'Hola', {});

    expect(enResult.summary).toBeTruthy();
    expect(esResult.summary).toBeTruthy();
  });
});

// ─── FALLBACK_RESPONSE Constant Tests ───────────────────────────────

describe('FALLBACK_RESPONSE', () => {
  it('should match the AIResponseSchema', () => {
    const result = AIResponseSchema.safeParse(FALLBACK_RESPONSE);
    expect(result.success).toBe(true);
  });

  it('should have handoff_required set to true', () => {
    expect(FALLBACK_RESPONSE.handoff_required).toBe(true);
  });

  it('should have a non-empty summary', () => {
    expect(FALLBACK_RESPONSE.summary.length).toBeGreaterThan(0);
  });
});

// ─── AIResponseSchema Validation Tests ──────────────────────────────

describe('AIResponseSchema', () => {
  it('should accept valid complete response', () => {
    const valid = {
      summary: 'Gate A is to your left.',
      recommended_action: 'Follow signs to Gate A.',
      reason: 'Based on current location.',
      priority: 'low',
      accessibility_notes: 'Ramp available.',
      handoff_required: false,
    };

    const result = AIResponseSchema.safeParse(valid);
    expect(result.success).toBe(true);
  });

  it('should accept minimal valid response (defaults applied)', () => {
    const minimal = {
      summary: 'Hello!',
    };

    const result = AIResponseSchema.safeParse(minimal);
    expect(result.success).toBe(true);
    expect(result.data.priority).toBe('low');
    expect(result.data.handoff_required).toBe(false);
  });

  it('should reject response with empty summary', () => {
    const invalid = {
      summary: '',
    };

    const result = AIResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject response with invalid priority', () => {
    const invalid = {
      summary: 'Test',
      priority: 'urgent', // not in enum
    };

    const result = AIResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it('should reject response without summary', () => {
    const invalid = {
      recommended_action: 'Do something',
    };

    const result = AIResponseSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });
});
