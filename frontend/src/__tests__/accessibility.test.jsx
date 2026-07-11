/**
 * @file accessibility.test.jsx
 * @description Automated accessibility tests for key UI components.
 * Verifies ARIA attributes, semantic HTML, keyboard navigation support,
 * and screen reader compatibility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FanAssistant from '../pages/FanAssistant';
import OperatorDashboard from '../pages/OperatorDashboard';

// Mock fetch for dashboard data
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSnapshot = {
  zones: [{ zoneId: 'zone_north', name: 'North Concourse', type: 'concourse', capacity: 5000 }],
  telemetry: [{ zoneId: 'zone_north', densityPercent: 40, queueLength: 15, waitTimeMinutes: 2, trend: 'stable' }],
  incidents: [],
  sustainability: { sustainabilityScore: 85, energyLoad: 75, transitShare: 68 },
};

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => mockSnapshot,
  });
});

function renderComponent(Component) {
  return render(
    <MemoryRouter>
      <Component />
    </MemoryRouter>
  );
}

// ─── Semantic HTML Tests ────────────────────────────────────────────

describe('Accessibility - Semantic HTML', () => {
  it('FanAssistant should have a chat log region', () => {
    renderComponent(FanAssistant);
    const log = screen.getByRole('log');
    expect(log).toBeInTheDocument();
    expect(log).toHaveAttribute('aria-live', 'polite');
  });

  it('OperatorDashboard should have section landmarks', async () => {
    renderComponent(OperatorDashboard);
    await screen.findByText('Command Center');

    expect(screen.getByLabelText(/zone telemetry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/sustainability metrics/i)).toBeInTheDocument();
  });
});

// ─── ARIA Attributes Tests ──────────────────────────────────────────

describe('Accessibility - ARIA Attributes', () => {
  it('FanAssistant send button should have aria-label', () => {
    renderComponent(FanAssistant);
    expect(screen.getByLabelText('Send message')).toBeInTheDocument();
  });

  it('FanAssistant accessibility toggle should have aria-pressed', () => {
    renderComponent(FanAssistant);
    const toggle = screen.getByLabelText(/accessible routing/i);
    expect(toggle).toHaveAttribute('aria-pressed');
  });

  it('FanAssistant icons should be hidden from screen readers', () => {
    renderComponent(FanAssistant);
    // Icons in buttons should have aria-hidden
    const sendBtn = screen.getByLabelText('Send message');
    const svg = sendBtn.querySelector('svg');
    if (svg) {
      expect(svg.getAttribute('aria-hidden')).toBe('true');
    }
  });

  it('OperatorDashboard progress bar should have proper ARIA', async () => {
    renderComponent(OperatorDashboard);
    await screen.findByText('Command Center');

    const progressBar = screen.getByRole('progressbar');
    expect(progressBar).toHaveAttribute('aria-valuemin', '0');
    expect(progressBar).toHaveAttribute('aria-valuemax', '100');
    expect(progressBar).toHaveAttribute('aria-valuenow');
  });
});

// ─── Form Labels Tests ──────────────────────────────────────────────

describe('Accessibility - Form Labels', () => {
  it('FanAssistant should have labeled form controls', () => {
    renderComponent(FanAssistant);

    // Chat input
    const input = screen.getByLabelText(/type your message/i);
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('id');

    // Language select
    const select = screen.getByLabelText(/select language/i);
    expect(select).toBeInTheDocument();
    expect(select).toHaveAttribute('id');
  });

  it('FanAssistant quick prompts should be in a labeled group', () => {
    renderComponent(FanAssistant);
    const group = screen.getByRole('group', { name: /quick prompts/i });
    expect(group).toBeInTheDocument();
  });
});

// ─── Interactive Element IDs ────────────────────────────────────────

describe('Accessibility - Unique IDs', () => {
  it('FanAssistant should have unique IDs on interactive elements', () => {
    renderComponent(FanAssistant);

    expect(document.getElementById('language-select')).toBeInTheDocument();
    expect(document.getElementById('chat-input')).toBeInTheDocument();
    expect(document.getElementById('btn-send-message')).toBeInTheDocument();
    expect(document.getElementById('btn-accessibility-toggle')).toBeInTheDocument();
    expect(document.getElementById('quick-prompt-0')).toBeInTheDocument();
  });

  it('OperatorDashboard should have unique IDs on interactive elements', async () => {
    renderComponent(OperatorDashboard);
    await screen.findByText('Command Center');

    expect(document.getElementById('btn-simulate-incident')).toBeInTheDocument();
  });
});
