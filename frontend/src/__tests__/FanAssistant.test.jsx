/**
 * @file FanAssistant.test.jsx
 * @description Component tests for the Fan Assistant chat interface.
 * Tests rendering, user interaction, accessibility features,
 * and error handling.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import FanAssistant from '../pages/FanAssistant';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

function renderFanAssistant() {
  return render(
    <MemoryRouter>
      <FanAssistant />
    </MemoryRouter>
  );
}

beforeEach(() => {
  mockFetch.mockReset();
});

// ─── Rendering Tests ────────────────────────────────────────────────

describe('FanAssistant - Rendering', () => {
  it('should render the welcome message', () => {
    renderFanAssistant();
    expect(screen.getByText(/Welcome to TournamentPulse AI/i)).toBeInTheDocument();
    expect(screen.getByRole('article', { name: /assistant response/i })).toBeInTheDocument();
  });

  it('should render the chat input', () => {
    renderFanAssistant();
    const input = screen.getByLabelText(/type your message/i);
    expect(input).toBeInTheDocument();
  });

  it('should render the language selector', () => {
    renderFanAssistant();
    const select = screen.getByLabelText(/select language/i);
    expect(select).toBeInTheDocument();
  });

  it('should render the accessibility toggle', () => {
    renderFanAssistant();
    const toggle = screen.getByLabelText(/enable accessible routing/i);
    expect(toggle).toBeInTheDocument();
  });

  it('should render quick prompt buttons', () => {
    renderFanAssistant();
    expect(screen.getByText('Find my gate')).toBeInTheDocument();
    expect(screen.getByText('Where is the nearest restroom?')).toBeInTheDocument();
  });

  it('should render the send button', () => {
    renderFanAssistant();
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeInTheDocument();
  });
});

// ─── Interaction Tests ──────────────────────────────────────────────

describe('FanAssistant - Interactions', () => {
  it('should update input value when typing', () => {
    renderFanAssistant();
    const input = screen.getByLabelText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Hello' } });
    expect(input.value).toBe('Hello');
  });

  it('should send message on button click', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        summary: 'Gate A is ahead',
        recommended_action: 'Walk forward',
        reason: 'Based on location',
        priority: 'low',
        handoff_required: false,
      }),
    });

    renderFanAssistant();
    const input = screen.getByLabelText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Find gate A' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText('Find gate A')).toBeInTheDocument();
    });
  });

  it('should send message on Enter key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        summary: 'Test response',
        handoff_required: false,
      }),
    });

    renderFanAssistant();
    const input = screen.getByLabelText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Test' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(screen.getByText('Test')).toBeInTheDocument();
    });
  });

  it('should not send empty messages', () => {
    renderFanAssistant();
    const sendBtn = screen.getByLabelText('Send message');
    expect(sendBtn).toBeDisabled();
  });

  it('should toggle accessibility mode', () => {
    renderFanAssistant();
    const toggle = screen.getByLabelText(/enable accessible routing/i);
    expect(toggle).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-pressed', 'true');
  });

  it('should send location and accessibility context to the assistant', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: 'Accessible route ready', handoff_required: false }),
    });

    renderFanAssistant();
    fireEvent.change(screen.getByLabelText(/select current location/i), { target: { value: 'gate_c' } });
    fireEvent.click(screen.getByLabelText(/enable accessible routing/i));
    fireEvent.change(screen.getByLabelText(/type your message/i), { target: { value: 'Section 104' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(1));
    const requestBody = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(requestBody.context).toEqual({ accessibilityMode: true, currentNode: 'gate_c' });
  });

  it('should handle quick prompt clicks', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        summary: 'Quick response',
        handoff_required: false,
      }),
    });

    renderFanAssistant();
    fireEvent.click(screen.getByText('Find my gate'));

    await waitFor(() => {
      expect(screen.getByText('Quick response')).toBeInTheDocument();
    });
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});

// ─── Error Handling Tests ───────────────────────────────────────────

describe('FanAssistant - Error Handling', () => {
  it('should display error message when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    renderFanAssistant();
    const input = screen.getByLabelText(/type your message/i);
    fireEvent.change(input, { target: { value: 'Help' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByText(/trouble connecting/i)).toBeInTheDocument();
    });
  });
});

// ─── Accessibility Tests ────────────────────────────────────────────

describe('FanAssistant - Accessibility', () => {
  it('should have a chat log region with role="log"', () => {
    renderFanAssistant();
    const log = screen.getByRole('log');
    expect(log).toBeInTheDocument();
    expect(log).toHaveAttribute('aria-label', 'Chat messages');
  });

  it('should have aria-live="polite" on the chat area', () => {
    renderFanAssistant();
    const log = screen.getByRole('log');
    expect(log).toHaveAttribute('aria-live', 'polite');
  });

  it('should have labels on all form controls', () => {
    renderFanAssistant();
    expect(screen.getByLabelText(/select language/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/type your message/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/send message/i)).toBeInTheDocument();
  });

  it('should have a quick prompts group', () => {
    renderFanAssistant();
    const group = screen.getByRole('group', { name: /quick prompts/i });
    expect(group).toBeInTheDocument();
  });

  it('should expose the user message as a labeled article', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ summary: 'Response', handoff_required: false }),
    });

    renderFanAssistant();
    fireEvent.change(screen.getByLabelText(/type your message/i), { target: { value: 'Need water' } });
    fireEvent.click(screen.getByLabelText('Send message'));

    await waitFor(() => {
      expect(screen.getByRole('article', { name: 'Your message' })).toHaveTextContent('Need water');
    });
  });
});
