# Mini Applicant Tracking System (ATS)

A full-stack mini ATS for managing candidates, hiring stages, search, and dashboard metrics.

## Tech Stack

- **Backend:** Node.js, Express, SQLite (via `node:sqlite`)
- **Frontend:** React 18, Vite, Tailwind CSS, React Router
- **Testing:** Node.js built-in test runner

## Features

- **Dashboard** — total candidates, active/hired counts, conversion rate, avg experience, candidates-by-stage bar chart, candidates-by-role breakdown, recent activity feed, newest candidates
- **Candidates** — full CRUD, search by name/email/role/skills, filter by stage/role/status, sort by date/name/experience
- **Pipeline Board** — kanban-style view with columns per stage (Applied → Screening → Interview → Offer → Hired), move candidates between stages
- **Candidate Detail** — profile view, edit form, activity timeline, stage movement with notes
- **Activity Log** — every stage change and creation is tracked per candidate

## Project Structure

```
├── server/
│   ├── src/
│   │   ├── index.js          # Express app entry point
│   │   ├── db.js             # SQLite setup & schema
│   │   ├── seed.js           # Seed data generator
│   │   ├── routes/
│   │   │   ├── candidates.js # Candidate CRUD + stage transitions
│   │   │   └── dashboard.js  # Metrics endpoint
│   │   └── tests/
│   │       └── api.test.js   # 13 API integration tests
│   └── package.json
├── client/
│   ├── src/
│   │   ├── App.jsx           # Router + layout
│   │   ├── api.js            # API client
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Candidates.jsx
│   │   │   ├── CandidateDetail.jsx
│   │   │   └── Pipeline.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── render.yaml               # Render deployment config
└── vercel.json               # Vercel deployment config
```

## Local Development

### Prerequisites

- Node.js 22+ (uses built-in `node:sqlite`)

### Setup

```bash
# Install dependencies
npm install --prefix server
npm install --prefix client

# Seed the database
npm run seed --prefix server

# Terminal 1: Start backend (port 3001)
npm run dev --prefix server

# Terminal 2: Start frontend dev server (port 5173, proxies /api to 3001)
npm run dev --prefix client
```

Open http://localhost:5173

### Production Mode

```bash
npm run build --prefix client
npm start --prefix server
```

Open http://localhost:3001 — Express serves the built frontend.

### Run Tests

```bash
npm test --prefix server
```

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/candidates` | List candidates (query: `q`, `stage`, `role`, `status`, `sort`, `order`) |
| GET | `/api/candidates/meta/filters` | Available stages and roles |
| GET | `/api/candidates/:id` | Candidate detail with activity timeline |
| POST | `/api/candidates` | Create candidate |
| PUT | `/api/candidates/:id` | Update candidate |
| DELETE | `/api/candidates/:id` | Delete candidate |
| POST | `/api/candidates/:id/stage` | Move to stage (`{ stage, note }`) |
| GET | `/api/dashboard/metrics` | Dashboard metrics |
| GET | `/api/health` | Health check |

## Deployment

### Render (Recommended — full-stack in one service)

1. Push this repo to GitHub
2. On [Render](https://render.com), create a new **Web Service** connected to your repo
3. Render auto-detects `render.yaml` — it will install deps, build the frontend, seed the DB, and start the server
4. Your app is live at `https://mini-ats.onrender.com`

### Vercel (Frontend) + Render/Railway (Backend)

1. **Backend:** Deploy `server/` to Render or Railway as a Node.js service. Note the URL (e.g. `https://mini-ats-api.onrender.com`).
2. **Frontend:** Import the repo in [Vercel](https://vercel.com). Set the build command to `npm install --prefix server && npm install --prefix client && npm run build --prefix client` and output directory to `client/dist`.
3. Update `client/src/api.js` to point to your backend URL instead of `/api`.

## Demo Video

A short demo video showcasing the dashboard, candidate management, pipeline board, and search is available at: [DEMO_VIDEO_LINK]

## License

MIT
