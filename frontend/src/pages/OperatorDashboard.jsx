import React, { useState, useEffect, useCallback } from 'react';
import { Activity, AlertTriangle, Users, CheckCircle, Map, Zap, RefreshCw } from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_URL || '';

export default function OperatorDashboard() {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchSnapshot = useCallback(() => {
    const controller = new AbortController();

    fetch(`${API_BASE}/api/snapshot`, { signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then(data => {
        setSnapshot(data);
        setLoading(false);
        setError(null);
        setLastUpdated(new Date());
      })
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error('[Dashboard] Fetch error:', err);
          setError('Unable to connect to the server. Retrying...');
          setLoading(false);
        }
      });

    return controller;
  }, []);

  useEffect(() => {
    const controller = fetchSnapshot();
    const interval = setInterval(() => fetchSnapshot(), 5000);
    return () => {
      controller.abort();
      clearInterval(interval);
    };
  }, [fetchSnapshot]);

  const triggerIncident = () => {
    fetch(`${API_BASE}/api/simulate/incident`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario: 'gate_closure', zoneId: 'zone_north' })
    }).then(() => fetchSnapshot());
  };

  const approveAction = (actionType, zoneId) => {
    fetch(`${API_BASE}/api/operator/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        actionType,
        zoneId,
        approvedBy: 'Dashboard Operator'
      })
    }).then(res => res.json())
      .then(data => {
        if (data.status === 'success') {
          // Show confirmation briefly
          alert(`Action "${actionType}" approved and logged for ${zoneId}`);
        }
      });
  };

  if (loading || !snapshot) {
    return (
      <div className="p-8 text-center" role="status" aria-live="polite">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" aria-hidden="true" />
        <p className="text-gray-600 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-surface-dim min-h-full overflow-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary-container tracking-tight">
            Command Center
          </h2>
          <p className="text-sm text-gray-500 font-mono" aria-live="off">
            LIVE // {lastUpdated ? lastUpdated.toISOString() : new Date().toISOString()}
          </p>
          {error && (
            <p className="text-sm text-error mt-1" role="alert">{error}</p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            id="btn-simulate-incident"
            onClick={triggerIncident}
            aria-label="Simulate a gate closure incident in the north zone"
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm"
          >
            <AlertTriangle size={18} aria-hidden="true" /> Simulate Incident
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Telemetry Panel */}
        <section className="col-span-2 space-y-6" aria-label="Zone telemetry">
          <div className="grid grid-cols-2 gap-4" role="list" aria-live="polite">
            {snapshot.telemetry.map(t => {
              const zone = snapshot.zones.find(z => z.zoneId === t.zoneId);
              const zoneName = zone?.name || t.zoneId;
              const isHighDensity = t.densityPercent > 60;

              return (
                <div
                  key={t.zoneId}
                  role="listitem"
                  aria-label={`${zoneName}: ${t.densityPercent}% density, queue ${t.queueLength}, wait ${t.waitTimeMinutes} minutes`}
                  className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"
                >
                  <div className={`absolute top-0 left-0 w-2 h-full ${isHighDensity ? 'bg-error' : 'bg-secondary'}`} aria-hidden="true"></div>
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="font-bold text-lg">{zoneName}</h3>
                    <span
                      className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${isHighDensity ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`}
                      aria-label={`Density: ${t.densityPercent} percent`}
                    >
                      {t.densityPercent}% DENSITY
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 font-mono text-xs">QUEUE</p>
                      <p className="font-bold text-xl flex items-center gap-1">
                        <Users size={16} className="text-gray-400" aria-hidden="true" /> {t.queueLength}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-mono text-xs">WAIT TIME</p>
                      <p className="font-bold text-xl">{t.waitTimeMinutes}m</p>
                    </div>
                    <div>
                      <p className="text-gray-500 font-mono text-xs">TREND</p>
                      <p className={`font-bold text-sm capitalize ${t.trend === 'increasing' ? 'text-error' : t.trend === 'decreasing' ? 'text-secondary' : 'text-gray-600'}`}>
                        {t.trend === 'increasing' ? '↑' : t.trend === 'decreasing' ? '↓' : '→'} {t.trend}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Map className="text-primary" aria-hidden="true" /> Active Incidents
            </h3>
            {snapshot.incidents.length === 0 ? (
              <p className="text-gray-500 text-sm flex items-center gap-2">
                <CheckCircle size={16} className="text-secondary" aria-hidden="true" />
                No active incidents. All systems nominal.
              </p>
            ) : (
              <div className="space-y-3" role="list" aria-label="Active incidents">
                {snapshot.incidents.map((inc, i) => (
                  <div
                    key={i}
                    role="listitem"
                    className="flex items-center justify-between p-4 bg-error/5 rounded-xl border border-error/20"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error" aria-hidden="true">
                        <AlertTriangle size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-error capitalize">{inc.scenario.replace(/_/g, ' ')}</p>
                        <p className="text-sm text-gray-600">{inc.operationalImpact}</p>
                      </div>
                    </div>
                    <button
                      id={`btn-approve-${i}`}
                      onClick={() => approveAction(inc.recommendedAction, inc.affectedZone)}
                      aria-label={`Approve ${inc.recommendedAction} action for ${inc.scenario.replace(/_/g, ' ')} incident`}
                      className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      Approve Action
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Sustainability & Context */}
        <aside className="space-y-6" aria-label="Sustainability metrics">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Zap className="text-secondary" aria-hidden="true" /> Sustainability Pulse
            </h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">Overall Score</span>
                  <span className="font-bold text-secondary">{snapshot.sustainability.sustainabilityScore}/100</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={snapshot.sustainability.sustainabilityScore} aria-valuemin={0} aria-valuemax={100} aria-label="Sustainability score">
                  <div className="h-full bg-secondary transition-all duration-500" style={{ width: `${snapshot.sustainability.sustainabilityScore}%` }}></div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100">
                <div>
                  <p className="text-gray-500 text-xs uppercase">Energy Load</p>
                  <p className="font-bold">{snapshot.sustainability.energyLoad}%</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs uppercase">Transit Share</p>
                  <p className="font-bold">{snapshot.sustainability.transitShare}%</p>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <Activity className="text-primary" aria-hidden="true" /> Quick Stats
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Total Zones</span>
                <span className="font-bold">{snapshot.zones.length}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Active Incidents</span>
                <span className={`font-bold ${snapshot.incidents.length > 0 ? 'text-error' : 'text-secondary'}`}>
                  {snapshot.incidents.length}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Avg. Wait Time</span>
                <span className="font-bold">
                  {Math.round(snapshot.telemetry.reduce((sum, t) => sum + t.waitTimeMinutes, 0) / snapshot.telemetry.length)}m
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Highest Density</span>
                <span className="font-bold text-error">
                  {Math.max(...snapshot.telemetry.map(t => t.densityPercent))}%
                </span>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
