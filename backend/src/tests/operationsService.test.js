const { clearCache, getIncidents } = require('../services/dataLoader');
const { executeApprovedAction, isKnownZone, simulateIncident } = require('../services/operationsService');

beforeEach(() => clearCache());

describe('operationsService', () => {
  it('recognizes only zones present in the venue data', () => {
    expect(isKnownZone('zone_north')).toBe(true);
    expect(isKnownZone('zone_unknown')).toBe(false);
  });

  it('executes an approved action and returns an audit record', () => {
    const result = executeApprovedAction({
      actionType: 'open_lane',
      zoneId: 'zone_north',
      approvedBy: 'Operator Smith',
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result.status).toBe('success');
    expect(result.audit).toEqual({
      action: 'open_lane',
      zone: 'zone_north',
      operator: 'Operator Smith',
      executedAt: '2026-01-01T00:00:00.000Z',
      source: 'human_approved',
    });
    expect(getIncidents().some((incident) => incident.affectedZone === 'zone_north')).toBe(false);
  });

  it('creates a structured demo incident for a known zone', () => {
    const result = simulateIncident({
      scenario: 'crowd_surge',
      zoneId: 'zone_south',
      now: new Date('2026-01-01T00:00:00.000Z'),
    });

    expect(result).toMatchObject({
      status: 'simulated',
      scenario: 'crowd_surge',
      zoneId: 'zone_south',
      updatedRiskScore: 'high',
    });
    expect(getIncidents().some((incident) => incident.scenario === 'crowd_surge')).toBe(true);
  });
});
