# Demo Script

1. **Start app**: `npm run dev`
2. **Operator Dashboard**: Open `http://localhost:5173/operator`. Notice the live telemetry, showing standard congestion levels (e.g., North Concourse at 40% density).
3. **Fan Assistant**: Open `http://localhost:5173/fan`. Ask: "Find my gate" and see the response.
4. **Accessibility Toggle**: Click "Accessible Route" in the Fan Assistant, and ask again. Observe the different routing logic prioritizing elevators.
5. **Simulate Incident**: Go back to the Operator Dashboard and click **"Simulate Incident"** (Gate B closure).
6. **Observe Changes**: Notice the active incident alert appear and the telemetry updating (risk score increasing).
7. **Action Approval**: Click "Approve Action" on the dashboard alert to simulate a human-in-the-loop dispatch (e.g. redirecting volunteers).
