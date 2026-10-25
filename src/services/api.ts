import {
  MonitoringStation,
  StationDataResponse,
  User,
  AuthResponse,
  SimulationCondition
} from '../types/index.ts';

const API_BASE = '/api';

/**
 * Safely parses fetch responses to guarantee that invalid JSON, HTML error
 * pages (e.g. from reverse proxies, Vite SPA fallbacks, or Cloud Run 50x pages),
 * or empty response streams never crash the frontend with SyntaxError: JSON.parse.
 */
async function safeParseResponse(res: Response): Promise<{
  ok: boolean;
  status: number;
  data: any;
  errorText?: string;
  isHtml: boolean;
}> {
  const status = res.status;
  const contentType = res.headers.get('content-type') || '';
  
  let rawText = '';
  try {
    rawText = await res.text();
  } catch (readErr: any) {
    return {
      ok: false,
      status,
      data: null,
      errorText: `Failed to read server response: ${readErr?.message || 'Network stream closed'}`,
      isHtml: false
    };
  }

  const trimmed = rawText.trim();
  const isHtml = trimmed.startsWith('<!doctype') || trimmed.startsWith('<html') || trimmed.startsWith('<body') || contentType.includes('text/html');
  const looksLikeJson = (trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'));

  if (!isHtml && (contentType.includes('application/json') || looksLikeJson)) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        ok: res.ok,
        status,
        data: parsed,
        errorText: parsed?.error || parsed?.message,
        isHtml: false
      };
    } catch {
      // Malformed JSON string despite headers
      return {
        ok: false,
        status,
        data: null,
        errorText: `Malformed JSON response received from server (HTTP ${status})`,
        isHtml: false
      };
    }
  }

  // Handle HTML or non-JSON payloads safely
  return {
    ok: res.ok && !isHtml,
    status,
    data: null,
    errorText: isHtml
      ? `Server or reverse-proxy returned an HTML error/warmup page instead of JSON (HTTP ${status}).`
      : trimmed || `HTTP Error ${status}`,
    isHtml
  };
}

export async function fetchStations(): Promise<MonitoringStation[]> {
  try {
    const res = await fetch(`${API_BASE}/stations`, {
      headers: { 'Accept': 'application/json' }
    });
    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data?.stations) {
      throw new Error(parsed.errorText || 'Failed to load Indiana air quality monitoring stations.');
    }
    return parsed.data.stations;
  } catch (err: any) {
    throw new Error(err.message || 'Failed to load Indiana air quality monitoring stations.');
  }
}

export async function fetchStationData(
  stationId: string,
  preset: string = '7d',
  simulateCondition: SimulationCondition | boolean = 'none'
): Promise<StationDataResponse> {
  const condStr = typeof simulateCondition === 'boolean'
    ? (simulateCondition ? 'stale_data' : 'none')
    : (simulateCondition || 'none');

  const url = `${API_BASE}/stations/${stationId}?preset=${encodeURIComponent(preset)}&simulateCondition=${encodeURIComponent(condStr)}`;

  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        'Accept': 'application/json'
      }
    });
  } catch (networkErr: any) {
    const customErr = new Error(`Network failure connecting to EcoInsight backend: ${networkErr?.message || 'Server unreachable'}`);
    (customErr as any).simulated = condStr === 'api_failure';
    (customErr as any).simulationCondition = condStr !== 'none' ? condStr : undefined;
    (customErr as any).statusCode = 0;
    throw customErr;
  }

  const parsed = await safeParseResponse(res);

  // If simulation condition is 'api_failure', ensure a clear, structured test mode error is surfaced
  // even if an intermediary proxy returned HTML or a fallback status
  if (condStr === 'api_failure') {
    const errorMsg = parsed.data?.error ||
      `[TEST MODE] Upstream Environmental API Service Unavailable: Connection to Open-Meteo / CAMS dispersion pipeline timed out (Simulated HTTP 503 Outage). Zero fabricated readings are substituted. Retry mechanism active.`;
    const customErr = new Error(errorMsg);
    (customErr as any).simulated = true;
    (customErr as any).simulationCondition = 'api_failure';
    (customErr as any).statusCode = parsed.status === 200 ? 503 : parsed.status;
    (customErr as any).details = parsed.data?.details;
    throw customErr;
  }

  // Handle server errors or non-OK status codes
  if (!parsed.ok || !parsed.data) {
    const errorMsg = parsed.data?.error || parsed.errorText || `Unable to fetch environmental data for station ${stationId} (HTTP ${parsed.status})`;
    const customErr = new Error(errorMsg);
    (customErr as any).simulated = parsed.data?.simulated || false;
    (customErr as any).simulationCondition = parsed.data?.simulationCondition;
    (customErr as any).statusCode = parsed.status;
    (customErr as any).details = parsed.data?.details;
    throw customErr;
  }

  // Validate presence of essential response fields
  if (!parsed.data.station || !parsed.data.historical) {
    throw new Error(`Incomplete environmental data returned for station ${stationId}. Zero fabricated data substituted.`);
  }

  return parsed.data as StationDataResponse;
}

export async function getCurrentUser(): Promise<User | null> {
  try {
    const res = await fetch(`${API_BASE}/auth/me`, {
      headers: { 'Accept': 'application/json' }
    });
    const parsed = await safeParseResponse(res);
    if (!parsed.ok || !parsed.data) return null;
    return parsed.data.user || null;
  } catch {
    return null;
  }
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  const parsed = await safeParseResponse(res);
  if (!parsed.ok || !parsed.data?.user) {
    throw new Error(parsed.data?.error || parsed.errorText || 'Login failed');
  }
  return parsed.data;
}

export async function loginDemo(persona: 'consultant' | 'coordinator' | 'analyst'): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/demo`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ persona })
  });
  const parsed = await safeParseResponse(res);
  if (!parsed.ok || !parsed.data?.user) {
    throw new Error(parsed.data?.error || parsed.errorText || 'Demo sign-in failed');
  }
  return parsed.data;
}

export async function register(params: {
  name: string;
  email: string;
  password: string;
  organization: string;
  role: 'Environmental Consultant' | 'Municipal Sustainability Coordinator' | 'Environmental Data Analyst' | 'Regulatory Compliance Officer';
  defaultStationId?: string;
}): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const parsed = await safeParseResponse(res);
  if (!parsed.ok || !parsed.data?.user) {
    throw new Error(parsed.data?.error || parsed.errorText || 'Registration failed');
  }
  return parsed.data;
}

export async function logout(): Promise<void> {
  try {
    await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
  } catch {
    // Ignore logout transport errors
  }
}

export async function saveUserDefaultStation(stationId: string): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/preferences`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify({ defaultStationId: stationId })
  });

  const parsed = await safeParseResponse(res);
  if (!parsed.ok || !parsed.data?.user) {
    throw new Error(parsed.data?.error || parsed.errorText || 'Failed to update preferences');
  }
  return parsed.data.user;
}
