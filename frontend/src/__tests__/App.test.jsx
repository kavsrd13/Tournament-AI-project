/**
 * @file App.test.jsx
 * @description Route-level regression tests for the application shell.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from '../App';

vi.mock('../pages/OperatorDashboard', () => ({
  default: () => <p>Operator dashboard content</p>,
}));

vi.mock('../pages/FanAssistant', () => ({
  default: () => <p>Fan assistant content</p>,
}));

afterEach(() => {
  window.history.replaceState({}, '', '/');
});

describe('App routing', () => {
  it('redirects an unknown path to the operator dashboard', async () => {
    window.history.replaceState({}, '', '/unknown-page');
    render(<App />);

    await waitFor(() => {
      expect(screen.getByText('Operator dashboard content')).toBeInTheDocument();
    });
  });
});
