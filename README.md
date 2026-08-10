# Quiz Engine — Frontend

React single-page application for the Quiz Engine platform. Provides separate instructor and student experiences — quiz generation and curation, publishing and analytics on the instructor side; quiz-taking, feedback, and on-demand practice on the student side — talking to the Spring Boot backend over a JWT-authenticated REST API.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | React |
| Build tool / dev server | Vite |
| Styling | Tailwind CSS |
| Language | JavaScript (not TypeScript — a deliberate scope decision given the project timeline, noted as future work) |
| HTTP client | Axios (or equivalent, via a shared `api/client.js`) |
| Package manager | npm |

---

## Prerequisites

1. **Node.js** — version 18 or later recommended (check with `node -v`). Use `nvm` if you need to manage multiple versions.
2. **npm** — ships with Node; check with `npm -v`.
3. **The backend running somewhere reachable** — either locally on `http://localhost:8080` (see the backend README) or a deployed instance. The frontend cannot do anything meaningful without a live backend to talk to.

---

## 1. Clone and install

```bash
git clone https://github.com/vipul-bagal/quiz-engine.git
cd quiz-engine/frontend
npm install
```

---

## 2. Environment configuration

Vite exposes environment variables to the client only if they're prefixed with `VITE_`. Create a `.env.local` file in the frontend root (this file should **never** be committed):

```bash
cp .env.example .env.local
```

### Environment variables

| Variable | Description |
|---|---|
| `VITE_API_URL` | Base URL of the backend API. For local development: `http://localhost:8080`. For a deployed backend: its full Azure URL. |

That's the only variable the frontend itself needs — every other credential (Anthropic key, R2 credentials, JWT secret) lives on the backend and is never exposed to the client.

If you're switching between a local backend and a deployed one during development, just edit `.env.local` and restart the dev server — Vite doesn't hot-reload environment variable changes.

---

## 3. Run the development server

```bash
npm run dev
```

By default this starts on **`http://localhost:5173`**. Vite's dev server supports hot module replacement, so most changes appear instantly without a full page reload.

---

## 4. Build for production

```bash
npm run build
```

Output goes to `dist/`. Preview the production build locally before deploying:

```bash
npm run preview
```

---

## Project structure (high level)

```
src/
├── api/                 one file per backend resource (auth.js, questions.js, courses.js, ...)
├── components/       shared UI components (DashboardShell, QuestionTile, GenerationLockGate, ...)
├── pages/
│   ├── instructor/    instructor-only routes and views
│   └── student/         student-only routes and views
├── App.jsx                top-level routing
└── main.jsx               entry point
```

Instructor and student areas are kept as separate route trees with their own navigation, reflecting the fact that these are genuinely different roles with non-overlapping capabilities — a student route can never reach an instructor-only endpoint, and the frontend's own routing mirrors that separation rather than gating a single shared view.

---

## Key behavioural notes

A few things worth knowing if you're extending this codebase, since they reflect deliberate decisions rather than oversights:

- **No browser storage of sensitive state.** Correctness of quiz answers is never sent to the client until a session is complete — the backend withholds it by design, not the frontend.
- **Generation locking.** While an instructor has a generation job running, the Generate Quiz and Mix Quiz pages show a locked state (`GenerationLockGate` / `useGenerationLock`) rather than allowing a second job to start concurrently. This polls the backend's active-jobs endpoint.
- **Memory-only state for anything resembling storage.** If you're building an artifact or a component that needs to persist data client-side, do not reach for `localStorage`/`sessionStorage` inside anything that might run in a sandboxed context — use React state.

---

## Deployment

The frontend is deployed to **Vercel**:
- Connect the repository, set the project root to `frontend/` if the repo is a monorepo.
- Vercel auto-detects the Vite framework preset.
- Set `VITE_API_URL` in Vercel's project environment variables to the deployed backend's Azure URL.
- Every push to the deployed branch triggers an automatic rebuild.

---

## Troubleshooting

| Symptom | Likely cause |
|---|---|
| Every API call fails with a network error | `VITE_API_URL` is unset, wrong, or the backend isn't actually running/reachable at that address. Check the Network tab for the actual request URL. |
| Login succeeds but subsequent requests return 401 | Check the token is actually being attached to outgoing requests (inspect request headers); check it hasn't expired (24-hour lifetime). |
| Changes to `.env.local` don't seem to take effect | Restart `npm run dev` — Vite reads env files once at startup. |
| Styles look broken after pulling latest changes | Run `npm install` again — a Tailwind config or dependency version may have changed. |
| Build succeeds locally but fails on Vercel | Check Vercel's build logs for a Node version mismatch, or an environment variable that's set locally but missing in the Vercel dashboard. |
