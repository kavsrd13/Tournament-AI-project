import React from 'react';
import { BrowserRouter as Router, Navigate, Routes, Route, NavLink } from 'react-router-dom';
import OperatorDashboard from './pages/OperatorDashboard';
import FanAssistant from './pages/FanAssistant';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen font-sans flex flex-col">
          {/* Skip-to-content link for keyboard/screen reader users */}
          <a href="#main-content" className="skip-link">
            Skip to main content
          </a>

          <header role="banner" className="bg-primary text-white p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center font-display font-bold"
                aria-hidden="true"
              >
                TP
              </div>
              <h1 className="font-display font-bold text-xl tracking-tight">
                TournamentPulse AI
              </h1>
            </div>
            <nav aria-label="Main navigation" className="flex gap-4">
              <NavLink
                to="/operator"
                id="nav-operator"
                className={({ isActive }) =>
                  `hover:text-primary-container bg-white/20 px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white/40 font-bold' : ''}`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                Operator Dashboard
              </NavLink>
              <NavLink
                to="/fan"
                id="nav-fan"
                className={({ isActive }) =>
                  `hover:text-primary-container bg-white/20 px-3 py-1 rounded-full transition-colors ${isActive ? 'bg-white/40 font-bold' : ''}`
                }
                aria-current={({ isActive }) => (isActive ? 'page' : undefined)}
              >
                Fan Assistant
              </NavLink>
            </nav>
          </header>

          <main id="main-content" role="main" tabIndex={-1} className="flex-1 flex flex-col relative overflow-hidden">
            <Routes>
              <Route path="/" element={<OperatorDashboard />} />
              <Route path="/operator" element={<OperatorDashboard />} />
              <Route path="/fan" element={<FanAssistant />} />
              <Route path="*" element={<Navigate to="/operator" replace />} />
            </Routes>
          </main>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
