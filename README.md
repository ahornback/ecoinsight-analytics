# EcoInsight Analytics

Graduate AI application development project: an Indiana PM2.5 air-quality dashboard. Analysts can inspect real hourly observations, a 24-hour CAMS forecast, data-quality diagnostics, and export a PDF report.

The app was originally generated in Google AI Studio. Frontend and backend run together in **one local process**.

## Current status

The existing application runs locally at [http://localhost:3000](http://localhost:3000). A Gemini API key is **not** required for current features (air quality data comes from Open-Meteo).

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Lucide icons, jsPDF |
| Backend | Node.js, Express, `tsx` (runs TypeScript without a separate compile step) |
| Auth | bcryptjs password hashing, JWT cookies |
| External data | [Open-Meteo Air Quality API](https://open-meteo.com/en/docs/air-quality-api) (Copernicus CAMS) |

## Prerequisites

- [Node.js](https://nodejs.org/) 20 or newer (this machine was verified with Node 24)
- npm (comes with Node.js)
- Internet access (the server fetches live air-quality data)

## Setup and run

From the project folder:

```bash
npm install
npm run dev
```

Then open **http://localhost:3000** in a browser.

Current features work without an environment file. A Gemini API key is not used.

`server.ts` loads a local `.env` file on startup. Copy `.env.example` to `.env` only when you need to override the port or set a secret. Do not commit `.env`.

To override the port for one session in PowerShell:

```powershell
$env:PORT = "3001"
npm run dev
```

The server listens on `0.0.0.0`. The port is `PORT` when that variable is set, otherwise `3000`.

In development, auth works when `JWT_SECRET` is unset. The signing key is random for that process, so tokens do not survive a restart unless you set `JWT_SECRET`. Production refuses to start until `JWT_SECRET` is a unique value of at least 24 characters. The placeholder in `.env.example` is rejected.

### Demo accounts

In development, use **Sign In**, then **Fill & Login**. The browser sends a persona name, not a password. These buttons are omitted from the production build, and `POST /api/auth/demo` returns 404 when `NODE_ENV` is production. There is no published password for these accounts. Register a new account to use email and password.

| Role | Email |
| --- | --- |
| Environmental Consultant | `consultant@apex-enviro.com` |
| Municipal Sustainability Coordinator | `coordinator@indy.gov` |
| Environmental Data Analyst | `analyst@idem-audits.org` |

### Other scripts

```bash
npm run lint      # TypeScript type-check only
npm run build     # Frontend into dist/ and server bundle into dist-server/
npm start         # Production server (sets NODE_ENV=production)
npm run clean     # Deletes dist/ and dist-server/
```

### Production start and AWS port

Build on a machine that has the dev dependencies, then start the built app:

```bash
npm install
npm run build
```

Set these environment variables in the AWS service configuration (do not put the real secret in source control):

| Variable | Required | Purpose |
| --- | --- | --- |
| `JWT_SECRET` | Yes | Random string, at least 24 characters. Not the `.env.example` placeholder. |
| `PORT` | No | Elastic Beanstalk, App Runner, and ECS set this. The process listens on `0.0.0.0:$PORT`. Default `3000`. |
| `COOKIE_SECURE` | No | Leave unset when the public site is HTTPS. Set to `false` only for an HTTP-only test. |
| `NODE_ENV` | No | `npm start` sets this to `production`. |

Start command:

```bash
npm start
```

That runs `node scripts/start.mjs`, which requires `dist/` and `dist-server/` and then runs `node dist-server/index.js`. Elastic Beanstalk also honors the `Procfile` (`web: npm start`).

Health check path: `GET /api/health`.

`npm install` on the server only needs the runtime packages (`express`, `bcryptjs`, `jsonwebtoken`, `cookie-parser`, `dotenv`) if `dist/` and `dist-server/` are already in the upload. Run `npm run build` before packaging. A production install does not include Vite.

## Project structure

```
extracted ecoinsight/
├── server.ts                 # Express app: API routes + Vite (dev) or dist/ (prod)
├── index.html                # HTML shell
├── package.json              # Dependencies and scripts (name: ecoinsight-analytics)
├── Procfile                  # Elastic Beanstalk process: npm start
├── scripts/start.mjs         # Production launcher
├── vite.config.ts            # Vite + React + Tailwind
├── tsconfig.json
├── src/                      # Frontend
│   ├── main.tsx
│   ├── App.tsx               # Dashboard state and layout
│   ├── index.css
│   ├── components/           # UI panels and modals
│   ├── services/
│   │   ├── api.ts            # Calls /api/* on the same origin
│   │   └── pdfReportGenerator.ts
│   └── types/index.ts        # Shared TypeScript types
└── server/                   # Backend
    ├── data/stations.ts      # 10 Indiana monitoring stations
    └── services/
        ├── airQualityService.ts
        └── authService.ts    # Users stored in server/data/users.json
```

Frontend and backend are **logically separated** (`src/` vs `server/`) but **not** two independent apps. Express serves both `/api/*` and the React UI on port 3000.

## Existing features

- Station selector (10 Indiana sites) and time windows (24h, 48h, 7d, 14d, 30d)
- Latest PM2.5 observation, AQI, completeness, and period peak
- Historical chart and 24-hour CAMS forecast (suppressed if data is too stale or incomplete)
- Data-quality / QA panel
- Register, login, logout
- PDF report export
- Developer testing panel (simulated API failure, missing data, stale data)

## Troubleshooting

| Problem | What to try |
| --- | --- |
| `npm install` fails with `ERESOLVE` / esbuild peer dependency | This repo pins `esbuild` `^0.28.0` so Vite 8 can install. If you still see the error, run `npm install --legacy-peer-deps`. |
| Port 3000 already in use | Stop the other process, or set `PORT=3001` then visit that port. |
| Dashboard shows an upstream API error | Open-Meteo must be reachable. Retry; no fake numbers are substituted. |
| `npm start` says the production build was not found | Run `npm run build`, then `npm start` again. |

## Possible later improvement

Split shared types into something like `shared/types.ts` so the backend does not import from `src/`. That change is not required to run or deploy the app.
