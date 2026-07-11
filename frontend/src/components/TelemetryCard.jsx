import React from 'react';
import { Users } from 'lucide-react';

export default function TelemetryCard({ telemetry, zoneName }) {
  const isHighDensity = telemetry.densityPercent > 60;
  const trendIcon = telemetry.trend === 'increasing' ? '↑' : telemetry.trend === 'decreasing' ? '↓' : '→';

  return (
    <div
      role="listitem"
      aria-label={`${zoneName}: ${telemetry.densityPercent}% density, queue ${telemetry.queueLength}, wait ${telemetry.waitTimeMinutes} minutes`}
      className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden"
    >
      <div className={`absolute top-0 left-0 w-2 h-full ${isHighDensity ? 'bg-error' : 'bg-secondary'}`} aria-hidden="true" />
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-bold text-lg">{zoneName}</h3>
        <span className={`px-2 py-1 rounded-md text-xs font-mono font-bold ${isHighDensity ? 'bg-error/10 text-error' : 'bg-secondary/10 text-secondary'}`} aria-label={`Density: ${telemetry.densityPercent} percent`}>
          {telemetry.densityPercent}% DENSITY
        </span>
      </div>
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <p className="text-gray-500 font-mono text-xs">QUEUE</p>
          <p className="font-bold text-xl flex items-center gap-1"><Users size={16} className="text-gray-400" aria-hidden="true" /> {telemetry.queueLength}</p>
        </div>
        <div>
          <p className="text-gray-500 font-mono text-xs">WAIT TIME</p>
          <p className="font-bold text-xl">{telemetry.waitTimeMinutes}m</p>
        </div>
        <div>
          <p className="text-gray-500 font-mono text-xs">TREND</p>
          <p className={`font-bold text-sm capitalize ${telemetry.trend === 'increasing' ? 'text-error' : telemetry.trend === 'decreasing' ? 'text-secondary' : 'text-gray-600'}`}>
            {trendIcon} {telemetry.trend}
          </p>
        </div>
      </div>
    </div>
  );
}
