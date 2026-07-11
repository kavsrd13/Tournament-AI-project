/**
 * @file OperatorDashboard.test.jsx
 * @description Component tests for the Operator Dashboard.
 * Tests rendering, data display, incident simulation, and accessibility.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import OperatorDashboard from '../pages/OperatorDashboard';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

const mockSnapshot = {
  zones: [
    { zoneId: 'zone_north', name: 'North Concourse', type: 'concourse', capacity: 5000 },
    { zoneId: 'zone_south', name: 'South Concourse', type: 'concourse', capacity: 4500 },
  ],
  telemetry: [
    { zoneId: 'zone_north', densityPercent: 72, queueLength: 45, waitTimeMinutes: 8, trend: 'increasing' },
    { zoneId: 'zone_south', densityPercent: 35, queueLength: 12, waitTimeMinutes: 2, trend: 'stable' },
  ],
  incidents: [
    {
      scenario: 'gate_closure',
      affectedZone: 'zone_north',
      severity: 'high',
      operationalImpact: 'Gate B closed. Reroute via Gate A.',
      recommendedAction: 'open_lane',
    },
  ],
  sustainability: {
    sustainabilityScore: 85,
    energyLoad: 75,
    transitShare: 68,
  },
};

function renderDashboard() {
  return render(
    <MemoryRouter>
      <OperatorDashboard />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockFetch.mockReset();
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => mockSnapshot,
  });
});

// ─── Rendering Tests ────────────────────────────────────────────────

describe('OperatorDashboard - Rendering', () => {
  it('should show loading state initially', () => {
    // Don't resolve fetch immediately
    mockFetch.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByText(/loading dashboard data/i)).toBeInTheDocument();
  });

  it('should render Command Center title after loading', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Command Center')).toBeInTheDocument();
    });
  });

  it('should render zone telemetry cards', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('North Concourse')).toBeInTheDocument();
      expect(screen.getByText('South Concourse')).toBeInTheDocument();
    });
  });

  it('should display density percentages', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('72% DENSITY')).toBeInTheDocument();
      expect(screen.getByText('35% DENSITY')).toBeInTheDocument();
    });
  });

  it('should render sustainability score', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('85/100')).toBeInTheDocument();
    });
  });

  it('should render incidents', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText(/gate closure/i)).toBeInTheDocument();
      expect(screen.getByText(/Gate B closed/i)).toBeInTheDocument();
    });
  });
});

// ─── Interaction Tests ──────────────────────────────────────────────

describe('OperatorDashboard - Interactions', () => {
  it('should have a simulate incident button', async () => {
    renderDashboard();
    await waitFor(() => {
      const btn = screen.getByLabelText(/simulate a gate closure/i);
      expect(btn).toBeInTheDocument();
    });
  });

  it('should call API when simulate incident is clicked', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Command Center')).toBeInTheDocument();
    });

    const btn = screen.getByLabelText(/simulate a gate closure/i);
    fireEvent.click(btn);

    await waitFor(() => {
      // Should have called fetch for simulate/incident
      const calls = mockFetch.mock.calls;
      const simulateCall = calls.find(c => c[0]?.includes?.('simulate'));
      expect(simulateCall).toBeTruthy();
    });
  });

  it('should have approve action buttons for incidents', async () => {
    renderDashboard();
    await waitFor(() => {
      const approveBtn = screen.getByLabelText(/approve.*open_lane/i);
      expect(approveBtn).toBeInTheDocument();
    });
  });
});

// ─── Accessibility Tests ────────────────────────────────────────────

describe('OperatorDashboard - Accessibility', () => {
  it('should have a telemetry section with aria-label', async () => {
    renderDashboard();
    await waitFor(() => {
      const section = screen.getByLabelText(/zone telemetry/i);
      expect(section).toBeInTheDocument();
    });
  });

  it('should have a sustainability section with aria-label', async () => {
    renderDashboard();
    await waitFor(() => {
      const section = screen.getByLabelText(/sustainability metrics/i);
      expect(section).toBeInTheDocument();
    });
  });

  it('should have a progress bar for sustainability score', async () => {
    renderDashboard();
    await waitFor(() => {
      const progressBar = screen.getByRole('progressbar', { name: /sustainability score/i });
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '85');
    });
  });

  it('should have loading indicator with role="status"', () => {
    mockFetch.mockReturnValue(new Promise(() => {}));
    renderDashboard();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('should have descriptive aria-labels on telemetry cards', async () => {
    renderDashboard();
    await waitFor(() => {
      const northCard = screen.getByLabelText(/North Concourse: 72% density/i);
      expect(northCard).toBeInTheDocument();
    });
  });
});

// ─── Quick Stats Tests ──────────────────────────────────────────────

describe('OperatorDashboard - Quick Stats', () => {
  it('should show total zones count', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Quick Stats')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument(); // 2 zones
    });
  });

  it('should show active incidents count', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('1')).toBeInTheDocument(); // 1 incident
    });
  });
});
