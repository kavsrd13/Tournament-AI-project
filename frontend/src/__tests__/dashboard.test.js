import { describe, expect, it } from 'vitest';
import { getZoneName, normalizeSnapshot } from '../utils/dashboard';

describe('dashboard selectors', () => {
  it('normalizes missing operational collections safely', () => {
    expect(normalizeSnapshot({})).toMatchObject({
      zones: [],
      telemetry: [],
      incidents: [],
      averageWait: 0,
      highestDensity: 0,
    });
  });

  it('derives stable metrics from telemetry', () => {
    const result = normalizeSnapshot({
      zones: [{ zoneId: 'zone_north', name: 'North Concourse' }],
      telemetry: [
        { zoneId: 'zone_north', densityPercent: 70, waitTimeMinutes: 8 },
        { zoneId: 'zone_south', densityPercent: 30, waitTimeMinutes: 2 },
      ],
      incidents: [],
    });

    expect(result.averageWait).toBe(5);
    expect(result.highestDensity).toBe(70);
    expect(getZoneName(result.zones, 'zone_north')).toBe('North Concourse');
    expect(getZoneName(result.zones, 'zone_unknown')).toBe('zone_unknown');
  });
});
