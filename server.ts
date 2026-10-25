import 'dotenv/config';
import express from 'express';
import cookieParser from 'cookie-parser';
import path from 'path';
import { INDIANA_STATIONS, getStationById } from './server/data/stations.ts';
import { fetchStationEnvironmentalData } from './server/services/airQualityService.ts';
import {
  assertJwtConfigured,
  loginUser,
  loginDemoPersona,
  registerUser,
  verifyToken,
  updateUserPreferences
} from './server/services/authService.ts';

const isProduction = process.env.NODE_ENV === 'production';
const PORT = Number(process.env.PORT) || 3000;
const HOST = '0.0.0.0';
const rootDir = process.cwd();

const ALLOWED_SIMULATIONS = ['none', 'api_failure', 'missing_observations', 'stale_data', 'incomplete_history'];

// Secure cookies require HTTPS. AWS load balancers and App Runner terminate
// TLS, so the browser still sees HTTPS. Set COOKIE_SECURE=false only for an
// HTTP-only test.
const cookieOptions = {
  httpOnly: true,
  sameSite: 'lax' as const,
  secure: isProduction && process.env.COOKIE_SECURE !== 'false',
  path: '/'
};

const authAttempts = new Map<string, { count: number; resetAt: number }>();

function limitAuthAttempts(req: express.Request, res: express.Response, next: express.NextFunction) {
  const key = req.ip || 'unknown';
  const now = Date.now();
  const current = authAttempts.get(key);
  if (!current || current.resetAt < now) {
    authAttempts.set(key, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  current.count += 1;
  if (current.count > 40) {
    return res.status(429).json({ error: 'Too many authentication attempts. Try again later.' });
  }
  next();
}

function sendAuthResult(res: express.Response, result: { token?: string; user: unknown; message: string }, status = 200) {
  if (!result.token) {
    return res.status(500).json({ error: 'Authentication could not be completed.' });
  }
  res.cookie('ecoinsight_token', result.token, {
    ...cookieOptions,
    maxAge: 7 * 24 * 3600 * 1000
  });
  res.status(status).json({ user: result.user, message: result.message });
}

async function startServer() {
  assertJwtConfigured();

  const app = express();
  // The client IP comes from the load balancer on AWS. Trust the first proxy.
  app.set('trust proxy', 1);

  app.use(express.json({ limit: '32kb' }));
  app.use(cookieParser());

  // Middleware to authenticate user if token exists
  app.use((req, res, next) => {
    let token = req.cookies?.ecoinsight_token;
    if (!token && req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const user = verifyToken(token);
      (req as any).user = user;
    }
    next();
  });

  // API Routes
  // 1. Health check & upstream diagnostics
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'operational',
      environment: isProduction ? 'production' : 'development',
      service: 'EcoInsight Analytics Backend (Indiana PM2.5)',
      timestamp: new Date().toISOString(),
      upstream: {
        openMeteoAirQuality: 'active',
        copernicusCamsEnsemble: 'active',
        idemAqsCatalog: 'loaded',
        totalEligibleIndianaStations: INDIANA_STATIONS.length
      }
    });
  });

  // 2. Monitoring stations catalog
  app.get('/api/stations', (req, res) => {
    res.json({
      stations: INDIANA_STATIONS,
      count: INDIANA_STATIONS.length
    });
  });

  // 3. Station environmental data (measurements, forecast, quality audit, summary stats)
  app.get('/api/stations/:id', async (req, res) => {
    try {
      const requestedId = String(req.params.id || '').slice(0, 64);
      const station = getStationById(requestedId);
      if (!station) {
        return res.status(404).json({
          error: `Monitoring station '${requestedId}' not found in Indiana EPA/IDEM registry.`
        });
      }

      const allowedPresets = ['24h', '48h', '7d', '14d', '30d'];
      const preset = (req.query.preset as string) || '7d';
      if (!allowedPresets.includes(preset)) {
        return res.status(400).json({
          error: `Invalid observation window '${preset}'. Use one of: ${allowedPresets.join(', ')}.`
        });
      }
      const simulateStale = req.query.simulateStale === 'true';
      const requestedSimulation = (req.query.simulateCondition as string) || (simulateStale ? 'stale_data' : 'none');
      // Simulations stay off in production. A request header cannot turn them on.
      const effectiveSimulation = !isProduction && ALLOWED_SIMULATIONS.includes(requestedSimulation)
        ? requestedSimulation
        : 'none';

      // Simulation 1: External environmental API failure
      // Note: Returning HTTP 500 (or 520) rather than 503 prevents reverse-proxies / Nginx
      // from intercepting 503 as a server warmup and replacing the JSON body with warmup.html
      if (effectiveSimulation === 'api_failure') {
        return res.status(500).json({
          error: `[TEST MODE] Upstream Environmental API Service Unavailable: Connection to Open-Meteo / CAMS dispersion pipeline timed out (Simulated HTTP 503 Outage). Zero fabricated readings are substituted. Retry mechanism active.`,
          simulated: true,
          simulationCondition: 'api_failure',
          stationId: station.id,
          stationName: station.name,
          details: 'Simulated upstream network timeout to verify graceful degradation and zero-fabrication rules.'
        });
      }

      const data = await fetchStationEnvironmentalData(station, preset, effectiveSimulation as any);
      res.json(data);
    } catch (err: any) {
      console.error('Error fetching station data:', err);
      res.status(500).json({
        error: 'Unable to retrieve environmental measurements from upstream sources.'
      });
    }
  });

  // 4. User Registration
  app.post('/api/auth/register', limitAuthAttempts, async (req, res) => {
    try {
      const { name, email, password, organization, role, defaultStationId } = req.body;
      const result = await registerUser({
        name,
        email,
        password,
        organization,
        role,
        defaultStationId
      });

      sendAuthResult(res, result, 201);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Registration failed' });
    }
  });

  // 5. User Login
  app.post('/api/auth/login', limitAuthAttempts, async (req, res) => {
    try {
      const email = req.body?.email;
      const password = req.body?.password;
      if (typeof email !== 'string' || !email.trim() || typeof password !== 'string' || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }
      const result = await loginUser(email, password);

      sendAuthResult(res, result);
    } catch (err: any) {
      res.status(401).json({ error: err?.message || 'Authentication failed' });
    }
  });

  // Demo sign-in is available only while the server is not in production.
  // The browser sends a persona name, not a password.
  app.post('/api/auth/demo', limitAuthAttempts, (req, res) => {
    if (isProduction) {
      return res.status(404).json({ error: 'Not found' });
    }
    try {
      const result = loginDemoPersona(req.body?.persona);
      sendAuthResult(res, result);
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Demo sign-in failed' });
    }
  });

  // 6. Current User Profile
  app.get('/api/auth/me', (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ user: null });
    }
    res.json({ user });
  });

  // 7. Logout
  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('ecoinsight_token', cookieOptions);
    res.json({ message: 'Logged out successfully' });
  });

  // 8. Update preferences
  app.put('/api/auth/preferences', (req, res) => {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    try {
      const { defaultStationId } = req.body;
      const updated = updateUserPreferences(user.id, defaultStationId);
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err?.message || 'Failed to update preferences' });
    }
  });

  // Frontend integration: Vite middleware in dev, static files in production.
  // Vite is loaded only in development so a production install does not need it.
  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false
      },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(rootDir, 'dist');
    app.use(express.static(distPath));
    app.use((req, res, next) => {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next();
      }
      if (req.path.startsWith('/api')) {
        return res.status(404).json({ error: 'Not found' });
      }
      res.sendFile(path.resolve(distPath, 'index.html'), (err) => {
        if (err) next(err);
      });
    });
  }

  app.listen(PORT, HOST, () => {
    console.log(`EcoInsight Analytics server running on http://${HOST}:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup failure:', err);
  process.exit(1);
});
