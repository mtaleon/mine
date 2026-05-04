/**
 * Backend health check for 2048
 * Checks if worker/backend is reachable on startup
 */

let API_URL = 'https://api.octile.eu.cc';
let _backendOnline = null; // null = unknown, true/false = checked
let _healthCheckPromise = null;

const HEALTH_POLL_MS = 600000; // 10 minutes
let _healthPollInterval = null;
let _lastHealthCheck = 0;

/**
 * Apply configuration from config.json
 */
export function applyConfig(config) {
  if (config.workerUrl) {
    API_URL = config.workerUrl;
  }
}

/**
 * Check backend health via /health endpoint
 */
async function checkBackendHealth() {
  try {
    const res = await fetch(API_URL + '/health', {
      method: 'GET',
      signal: AbortSignal.timeout(3000),
    });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'ok';
  } catch {
    return false;
  }
}

/**
 * Refresh backend status (with promise caching)
 */
export function refreshBackendStatus() {
  if (_healthCheckPromise) return _healthCheckPromise;
  _healthCheckPromise = checkBackendHealth().then(ok => {
    _backendOnline = ok;
    _healthCheckPromise = null;
    console.debug('[mine] Backend status:', ok ? 'online' : 'offline');
    return ok;
  });
  return _healthCheckPromise;
}

/**
 * Get current backend status
 */
export function isBackendOnline() {
  return _backendOnline === true;
}

/**
 * Kick health check (with rate limiting)
 */
function kickHealthCheck(force) {
  if (!force && Date.now() - _lastHealthCheck < HEALTH_POLL_MS) return;
  return refreshBackendStatus().finally(() => {
    _lastHealthCheck = Date.now();
  });
}

/**
 * Start periodic health polling (every 10 minutes)
 */
export function startHealthPoll() {
  if (_healthPollInterval) return;
  kickHealthCheck(false);
  _healthPollInterval = setInterval(() => {
    kickHealthCheck(true);
  }, HEALTH_POLL_MS);
}

/**
 * Stop periodic health polling
 */
export function stopHealthPoll() {
  if (_healthPollInterval) {
    clearInterval(_healthPollInterval);
    _healthPollInterval = null;
  }
}
