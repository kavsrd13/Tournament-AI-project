# Contributing

## Development standard

- Use Node.js 20 or newer and keep generated files, dependencies, and secrets out of Git.
- Keep business rules in services, HTTP concerns in routes, and UI data access in the frontend API layer.
- Add or update a focused test for every behavior change. Preserve keyboard access and visible focus states for UI changes.
- Use the existing request validation and structured error format; do not bypass them for new endpoints.

## Before committing

Run the full reproducible quality gate:

```bash
npm run quality
```

It runs backend and frontend tests, linting, a production build, and the hackathon submission-size and hygiene checks.
