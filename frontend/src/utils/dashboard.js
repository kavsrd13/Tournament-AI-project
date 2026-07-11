export function normalizeSnapshot(snapshot) {
  const zones = Array.isArray(snapshot?.zones) ? snapshot.zones : [];
  const telemetry = Array.isArray(snapshot?.telemetry) ? snapshot.telemetry : [];
  const incidents = Array.isArray(snapshot?.incidents) ? snapshot.incidents : [];
  const sustainability = snapshot?.sustainability || { sustainabilityScore: 0, energyLoad: 0, transitShare: 0 };
  const averageWait = telemetry.length
    ? Math.round(telemetry.reduce((sum, item) => sum + item.waitTimeMinutes, 0) / telemetry.length)
    : 0;
  const highestDensity = telemetry.length ? Math.max(...telemetry.map((item) => item.densityPercent)) : 0;

  return { zones, telemetry, incidents, sustainability, averageWait, highestDensity };
}

export function getZoneName(zones, zoneId) {
  return zones.find((zone) => zone.zoneId === zoneId)?.name || zoneId;
}
