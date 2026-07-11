# TournamentPulse AI

TournamentPulse AI is a smart stadium operations assistant for a large international football event. It serves two personas from one small full-stack application:

- **Fan experience vertical:** a multilingual, accessibility-aware assistant that answers venue questions and computes congestion-aware routes to gates, sections, amenities, first aid, and transit.
- **Venue operations vertical:** a command-center view that turns telemetry and incidents into explainable recommendations. Operators remain in control: recommendations never execute without a human approval and audit record.

## Why this solves the challenge

Large venues create two connected problems: visitors need immediate, context-aware guidance, while staff need a fast way to understand crowd pressure and respond safely. TournamentPulse uses the visitor's current location, accessibility preference, stadium graph, and live synthetic telemetry to make a concrete decision. Operators see the same operational context and can simulate, review, and approve a reversible response.

## How the solution works

1. A fan selects a language, starting location, and optional Accessible Route mode, then asks a natural-language question.
2. The backend validates and sanitizes the request. Common requests are handled by a deterministic local decision layer, so the demo is useful even without an API key.
3. The local layer maps destinations to the stadium graph and runs Dijkstra's algorithm. Congestion multipliers use current density; accessible mode excludes stair-only edges.
4. If `AI_API_KEY` is configured, Gemini adds a multilingual natural-language response. Its output is schema-validated. If the provider times out or returns invalid JSON, the same grounded local decision layer is used.
5. Operators receive telemetry, incident status, sustainability metrics, and clear next actions. Approval is explicitly human-in-the-loop and is written to the response audit object.

## Architecture

```text
React/Vite UI
  ├── Fan Assistant: language + location + accessibility context
  └── Command Center: telemetry + incidents + approval feedback
          │
          ▼
Express API
  ├── Zod validation + input limits
  ├── local assistant decision layer
  ├── optional Gemini provider with timeout/output validation
  ├── Dijkstra route service
  └── in-memory data loader + audit-safe operator actions
          │
          ▼
Synthetic stadium graph, telemetry, FAQ, incident, and sustainability data
```

## Accessibility and safety decisions

- Keyboard users have a skip link, semantic landmarks, visible focus styles, labeled controls, live status regions, and reduced-motion support.
- The fan route toggle is exposed with `aria-pressed`; route and location controls are labeled and usable without a mouse.
- The dashboard describes recommendation status and action results without intrusive browser alerts.
- Helmet, strict CORS allowlisting, rate limiting, JSON body limits, validation, output limits, and structured errors protect the API surface.
- Prompt content is treated as untrusted data and never changes the assistant's persona or operational rules.
- Operator actions are allowlisted, require a named approver, validate the target zone against the stadium data, and return an audit record. AI never executes an operation autonomously.

## Run locally

Prerequisite: Node.js 20+ and npm.

```bash
npm run install:all
npm run dev
```

Open `http://localhost:5173/operator` for the command center or `http://localhost:5173/fan` for the visitor assistant.

### Optional AI provider

Copy `.env.example` to `backend/.env` and set `AI_API_KEY`. The application remains fully demoable without it through the local stadium logic.

```text
PORT=4000
FRONTEND_URL=http://localhost:5173
AI_API_KEY=
AI_MODEL=gemini-2.0-flash
ASSISTANT_RATE_LIMIT_PER_MINUTE=20
```

## Test and quality checks

```bash
npm test                 # backend unit and API/security tests
npm run test:frontend    # frontend component and accessibility tests
npm run test:all         # backend + frontend test suites
npm run lint             # backend + frontend static analysis
npm run build            # production frontend build
npm run check:submission # branch, size, dependency, and secret hygiene
npm run quality          # complete local quality gate
```

The test suite covers route correctness, accessibility constraints, request validation, prompt/XSS handling, security headers, CORS, rate limiting behavior, human approval requirements, assistant fallback behavior, and API integration.

## API overview

| Endpoint | Purpose |
| --- | --- |
| `GET /api/health` | Liveness check |
| `GET /api/snapshot` | Zones, telemetry, incidents, sustainability snapshot |
| `GET /api/routes?from=gate_a&to=section_104&avoidCrowds=true&accessibility=true` | Grounded route calculation |
| `POST /api/assistant` | Fan/operator assistant request |
| `POST /api/simulate/incident` | Demo-only incident creation |
| `POST /api/operator/action` | Human-approved, allowlisted operational action |

## Assumptions and scope

- The venue data is synthetic and intentionally small enough to inspect and test locally.
- Telemetry is a sample snapshot; polling demonstrates the live-operations workflow but does not connect to production sensors.
- Operator identity is represented by a validated approver name for the hackathon demo. Production deployment would add authenticated RBAC, immutable audit storage, and approval separation of duties.
- Route estimates are walking estimates in minutes, not emergency evacuation instructions.
- The optional AI provider improves language fluency; safety-critical routing and action constraints remain in deterministic application code.

## Submission checklist

- Keep the GitHub repository public.
- Keep only one branch.
- Do not commit `node_modules`, build outputs, secrets, or local `.env` files.
- Keep the repository under the 10 MB submission limit.
- Include this README and the complete source/data/tests needed to reproduce the demo.
