# TournamentPulse AI 🏟️

**TournamentPulse AI** is a comprehensive, full-stack smart stadium operations assistant designed for massive events like the FIFA World Cup 2026. 

When managing an event with 80,000+ attendees, two major challenges arise: fans get lost or frustrated navigating massive venues, and stadium staff struggle to keep track of where crowds are bottlenecking. This project solves both problems using AI, real-time data, and advanced routing algorithms.

The application is split into two main interfaces: one for the fans, and one for the stadium staff.

---

## 1. The Fan Assistant (For the Visitors)

A smart, accessible chat interface where fans can get instant help.

* **Smart Navigation (The "Google Maps" of the Stadium):** If you ask for directions, the app doesn't just give you a static route. It calculates the absolute fastest route *right now*. If it knows the North Concourse is completely packed with people, it will route you through the East Concourse instead.
* **Accessibility-First:** A simple toggle button for "Accessible Route" allows fans in wheelchairs or with limited mobility to get routes that completely avoid stairs, prioritizing elevators and ramps.
* **Multilingual:** Because global events draw global crowds, the AI can instantly translate and converse with fans in English, Spanish, French, Arabic, Japanese, and more.

## 2. The Command Center (For Stadium Operators)

A live dashboard for the security and operations team sitting in a control room.

* **Live Heatmaps & Telemetry:** Staff can see a live feed of exactly how crowded every zone in the stadium is, how long the queues are, and if the crowd is growing or shrinking.
* **Instant Incident Simulation & Response:** If a disaster happens—for example, a gate breaks and has to be closed—the dashboard flashes an alert. The AI instantly calculates the impact of this closure and recommends a solution (e.g., "Open Lane B to handle the overflow"). 
* **Human-in-the-Loop Security:** The AI is never allowed to just change stadium operations autonomously. It only *recommends* actions. A real human operator must look at the recommendation and click **"Approve Action"** to execute it and resolve the incident. This ensures ultimate safety.

---

## How It Works Under the Hood (Technical Architecture)

* **The Map Data Structure:** We built a synthetic digital map of a stadium (with gates, concourses, and restrooms) and connected them all with invisible mathematical edges, noting the distance, base walking time, and whether there are stairs. *(Note: This map is a backend data structure, not a visual 2D graphic on the frontend UI).*
* **The Routing Algorithm:** The backend uses **Dijkstra's Algorithm** to calculate the shortest path through the stadium graph, applying dynamic penalties for high crowd density or inaccessible paths.
* **Security & Hardening:** The backend features heavy security validation. Every API request and AI prompt is checked by strict Zod schemas to ensure malicious actors cannot inject code or bypass the human-in-the-loop safeguards.
* **Tech Stack:** React (Vite), Tailwind CSS, Node.js, Express, Zod, Vitest. 

---

## Getting Started

### Backend
1. `cd backend`
2. `npm install`
3. Create a `.env` file and add your `GEMINI_API_KEY`
4. `npm start` (Runs on port 4000)
5. Run tests: `npm test`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev` (Runs on port 5173)
4. Run tests: `npm test`
