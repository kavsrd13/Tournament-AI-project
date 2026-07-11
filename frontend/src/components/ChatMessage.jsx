import React from 'react';
import { MapPin } from 'lucide-react';

export default function ChatMessage({ message }) {
  const isUser = message.sender === 'user';

  return (
    <article
      aria-label={isUser ? 'Your message' : 'TournamentPulse assistant response'}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
    >
      <div className={`max-w-[80%] rounded-2xl p-4 ${isUser ? 'bg-primary text-white' : 'bg-surface-dim text-gray-800'}`}>
        <p className="break-words">{message.text}</p>
        {message.action && (
          <div className="mt-3 bg-white/50 rounded-lg p-3 border border-white/20">
            <p className="text-sm font-bold flex items-center gap-2 mb-1">
              <MapPin size={14} aria-hidden="true" /> Recommendation
            </p>
            <p className="text-sm break-words">{message.action}</p>
            {message.reason && <p className="text-xs text-gray-500 mt-1 italic break-words">{message.reason}</p>}
            {message.route && <p className="text-xs text-gray-500 mt-1">Route: {message.route.path.join(' -> ')} ({message.route.distanceMeters}m)</p>}
            {message.priority && <span className="inline-block mt-2 text-xs px-2 py-0.5 rounded-full font-mono bg-green-100 text-green-700">{message.priority.toUpperCase()}</span>}
            {message.source && <p className="text-[11px] text-gray-400 mt-2">Grounded in stadium data</p>}
          </div>
        )}
      </div>
    </article>
  );
}
