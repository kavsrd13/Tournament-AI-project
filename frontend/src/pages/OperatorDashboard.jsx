import React, { useState } from 'react';
import { Activity, AlertTriangle, CheckCircle, Map, RefreshCw, Zap } from 'lucide-react';
import TelemetryCard from '../components/TelemetryCard';
import { approveOperatorAction, simulateIncident } from '../services/api';
import { useSnapshotPolling } from '../hooks/useSnapshotPolling';
import { getZoneName, normalizeSnapshot } from '../utils/dashboard';

export default function OperatorDashboard() {
  const { snapshot, loading, error, lastUpdated, refresh } = useSnapshotPolling();
  const [busyAction, setBusyAction] = useState(null);
  const [feedback, setFeedback] = useState('');

  const handleSimulation = async () => {
    setBusyAction('simulate');
    setFeedback('');
    try {
      await simulateIncident({ scenario: 'gate_closure', zoneId: 'zone_north' });
      setFeedback('Demo incident created. Review the recommendation before approving an action.');
      await refresh();
    } catch (requestError) {
      console.error('[OperatorDashboard] Incident simulation error:', requestError);
      setFeedback('Unable to create the demo incident. Please try again.');
    } finally {
      setBusyAction(null);
    }
  };

  const handleApproval = async (actionType, zoneId) => {
    const actionKey = `${actionType}:${zoneId}`;
    setBusyAction(actionKey);
    setFeedback('');
    try {
      await approveOperatorAction({ actionType, zoneId, approvedBy: 'Dashboard Operator' });
      setFeedback(`Action “${actionType.replace(/_/g, ' ')}” approved and audit logged for ${zoneId}.`);
      await refresh();
    } catch (requestError) {
      console.error('[OperatorDashboard] Action approval error:', requestError);
      setFeedback('The action could not be approved. Check the connection and try again.');
    } finally {
      setBusyAction(null);
    }
  };

  if (loading && !snapshot) {
    return (
      <div className="p-8 text-center" role="status" aria-live="polite">
        <RefreshCw className="w-8 h-8 mx-auto mb-4 text-primary animate-spin" aria-hidden="true" />
        <p className="text-gray-600 font-medium">Loading dashboard data...</p>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="p-8 text-center" role="alert">
        <AlertTriangle className="w-8 h-8 mx-auto mb-4 text-error" aria-hidden="true" />
        <h2 className="text-xl font-bold text-gray-900 mb-2">Dashboard unavailable</h2>
        <p className="text-gray-600 mb-4">{error || 'The stadium data service did not respond.'}</p>
        <button type="button" onClick={() => refresh()} className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-xl font-medium">
          Retry connection
        </button>
      </div>
    );
  }

  const { zones, telemetry, incidents, sustainability, averageWait, highestDensity } = normalizeSnapshot(snapshot);

  return (
    <div className="p-6 bg-surface-dim min-h-full overflow-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-bold text-primary-container tracking-tight">Command Center</h2>
          <p className="text-sm text-gray-500 font-mono" aria-live="off">LIVE // {lastUpdated ? lastUpdated.toLocaleTimeString() : 'connecting'}</p>
          {error && <p className="text-sm text-error mt-1" role="alert">{error}</p>}
          {feedback && <p className="text-sm text-primary mt-1" role="status" aria-live="polite">{feedback}</p>}
        </div>
        <button id="btn-simulate-incident" type="button" onClick={handleSimulation} disabled={busyAction === 'simulate'} aria-label="Simulate a gate closure incident in the north zone" className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-50">
          <AlertTriangle size={18} aria-hidden="true" /> {busyAction === 'simulate' ? 'Simulating…' : 'Simulate Incident'}
        </button>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <section className="col-span-2 space-y-6" aria-label="Zone telemetry" aria-busy={loading}>
          <div className="grid grid-cols-2 gap-4" role="list" aria-live="polite">
            {telemetry.map((item) => <TelemetryCard key={item.zoneId} telemetry={item} zoneName={getZoneName(zones, item.zoneId)} />)}
          </div>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" aria-labelledby="incidents-heading">
            <p className="text-sm text-gray-600 mb-4" id="approval-help">Recommendations are advisory. A named operator must approve each action; every approval is audit logged.</p>
            <h3 id="incidents-heading" className="font-bold text-lg mb-4 flex items-center gap-2"><Map className="text-primary" aria-hidden="true" /> Active Incidents</h3>
            {incidents.length === 0 ? (
              <p className="text-gray-500 text-sm flex items-center gap-2"><CheckCircle size={16} className="text-secondary" aria-hidden="true" /> No active incidents. All systems nominal.</p>
            ) : (
              <div className="space-y-3" role="list" aria-label="Active incidents">
                {incidents.map((incident, index) => {
                  const actionKey = `${incident.recommendedAction}:${incident.affectedZone}`;
                  return (
                    <div key={`${incident.scenario}-${incident.affectedZone}-${index}`} role="listitem" className="flex items-center justify-between p-4 bg-error/5 rounded-xl border border-error/20">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center text-error" aria-hidden="true"><AlertTriangle size={20} /></div>
                        <div>
                          <p className="font-bold text-error capitalize">{incident.scenario.replace(/_/g, ' ')}</p>
                          <p className="text-sm text-gray-600">{incident.operationalImpact}</p>
                        </div>
                      </div>
                      <button id={`btn-approve-${index}`} type="button" onClick={() => handleApproval(incident.recommendedAction, incident.affectedZone)} disabled={busyAction === actionKey} aria-describedby="approval-help" aria-label={`Approve ${incident.recommendedAction} action for ${incident.scenario.replace(/_/g, ' ')} incident`} className="bg-primary hover:bg-primary-container text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50">
                        {busyAction === actionKey ? 'Approving…' : 'Approve Action'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </section>

        <aside className="space-y-6" aria-label="Sustainability metrics">
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" aria-labelledby="sustainability-heading">
            <h3 id="sustainability-heading" className="font-bold text-lg mb-4 flex items-center gap-2"><Zap className="text-secondary" aria-hidden="true" /> Sustainability Pulse</h3>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1"><span className="font-medium">Overall Score</span><span className="font-bold text-secondary">{sustainability.sustainabilityScore}/100</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden" role="progressbar" aria-valuenow={sustainability.sustainabilityScore} aria-valuemin={0} aria-valuemax={100} aria-label="Sustainability score"><div className="h-full bg-secondary transition-all duration-500" style={{ width: `${sustainability.sustainabilityScore}%` }} /></div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100"><div><p className="text-gray-500 text-xs uppercase">Energy Load</p><p className="font-bold">{sustainability.energyLoad}%</p></div><div><p className="text-gray-500 text-xs uppercase">Transit Share</p><p className="font-bold">{sustainability.transitShare}%</p></div></div>
            </div>
          </section>

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100" aria-labelledby="stats-heading">
            <h3 id="stats-heading" className="font-bold text-lg mb-4 flex items-center gap-2"><Activity className="text-primary" aria-hidden="true" /> Quick Stats</h3>
            <div className="space-y-3"><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Total Zones</span><span className="font-bold">{zones.length}</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Active Incidents</span><span className={`font-bold ${incidents.length > 0 ? 'text-error' : 'text-secondary'}`}>{incidents.length}</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Avg. Wait Time</span><span className="font-bold">{averageWait}m</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-600">Highest Density</span><span className="font-bold text-error">{highestDensity}%</span></div></div>
          </section>
        </aside>
      </div>
    </div>
  );
}
