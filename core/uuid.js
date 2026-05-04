const COOKIE_KEY = 'octile_cookie_uuid';
const BROWSER_KEY = 'octile_browser_uuid';

/**
 * Generate a UUID v4
 * Uses crypto.randomUUID if available, otherwise fallback to Math.random
 */
function generateUUID() {
  if (crypto.randomUUID) return crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

/**
 * Get browser UUID for player identification
 * Prefers server-issued cookie UUID, falls back to client-generated UUID
 * Matches Octile's UUID strategy
 */
export function getBrowserUUID() {
  // Prefer Worker-issued cookie UUID (set via X-Cookie-UUID response header)
  let uuid = localStorage.getItem(COOKIE_KEY);
  if (uuid) return uuid;

  // Fallback to legacy client-generated UUID
  uuid = localStorage.getItem(BROWSER_KEY);
  if (!uuid) {
    uuid = generateUUID();
    localStorage.setItem(BROWSER_KEY, uuid);
  }
  return uuid;
}

/**
 * Capture server-issued UUID from response header
 * Only saves if no UUID exists yet (prevents overwrite on subsequent requests)
 * Matches Octile's capture strategy
 */
export function captureCookieUUID(response) {
  if (!response?.headers) return;
  const cookieUUID = response.headers.get('X-Cookie-UUID');
  // Only set if we don't have ANY UUID yet (prevents localStorage overwrite)
  if (cookieUUID && !localStorage.getItem(COOKIE_KEY) && !localStorage.getItem(BROWSER_KEY)) {
    localStorage.setItem(COOKIE_KEY, cookieUUID);
  }
}

/**
 * Generate a new submission ID for each score submission
 */
export function generateSubmissionID() {
  return generateUUID();
}
