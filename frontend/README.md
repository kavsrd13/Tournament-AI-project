# TournamentPulse AI frontend

This React and Vite client provides the accessible Fan Assistant and the Venue Operations Command Center.

## Local development

From the repository root, run:

```bash
npm run install:all
npm run dev
```

Vite runs at `http://localhost:5173` and proxies `/api` requests to the backend at `http://localhost:4000` in local development.

## Commands

```bash
npm run dev --prefix frontend
npm run test:frontend
npm run lint --prefix frontend
npm run build --prefix frontend
```

The UI keeps network access in `src/services/api.js`, dashboard normalization in `src/utils/dashboard.js`, and polling behavior in `src/hooks/useSnapshotPolling.js`. Components render accessible, semantic states and are covered by component, routing, recovery, and accessibility tests.
