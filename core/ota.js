/**
 * OTA (Over-The-Air) Update System for Mine
 * Simplified to match Octile's pattern
 *
 * - Only checks for updates on native apps (file:// protocol)
 * - Fetches version.json from site URL
 * - Shows update banner with force update support
 * - Native Android downloads in background via AndroidOTA interface
 */

const GAME_ID = 'mine';
let SITE_URL = 'https://mine.octile.eu.cc/';
const APP_VERSION_CODE = 1; // Match version.json otaVersionCode

/**
 * Apply configuration from config.json
 */
export function applyOtaConfig(config) {
  if (config.siteUrl) {
    SITE_URL = config.siteUrl;
  }
}

/**
 * Check for updates (called 3 seconds after app startup)
 * Only runs on native apps (file:// protocol)
 */
export function checkForUpdate() {
  // Only check for updates in native app context (file:// protocol).
  // On the web (https://), the page itself IS the latest version.
  if (location.protocol !== 'file:') return;

  fetch(SITE_URL + 'version.json?t=' + Date.now())
    .then(r => r.ok ? r.json() : null)
    .catch(() => null)
    .then(data => {
      if (!data) return;

      // --- Force update check (non-dismissible blocker) ---
      const minVer = data.minAndroidVersionCode || 0;
      if (minVer > APP_VERSION_CODE) {
        const url = data.playStoreUrl || '';
        document.getElementById('update-text').textContent = 'Update required to continue';
        document.getElementById('update-btn').textContent = 'Update';
        document.getElementById('update-btn').onclick = () => { if (url) window.open(url, '_blank'); };
        document.getElementById('update-dismiss').style.display = 'none';
        document.getElementById('update-banner').classList.add('show', 'force');
        // Block back button dismiss
        document.getElementById('update-banner').onclick = function(e) { e.stopPropagation(); };
        return; // Don't show normal banner on top of force update
      }

      // --- Normal update banner (dismissible) ---
      const remoteVersion = data.otaVersionCode || 0;
      if (remoteVersion <= APP_VERSION_CODE) return;

      const dismissedKey = `octile:${GAME_ID}:ota_dismissed_v${remoteVersion}`;
      if (localStorage.getItem(dismissedKey)) return;

      const notes = data.releaseNotes?.en || 'A new version is available';
      document.getElementById('update-text').textContent = 'Update available — ' + notes;
      document.getElementById('update-btn').textContent = 'Learn More';
      document.getElementById('update-dismiss').textContent = 'Later';
      document.getElementById('update-dismiss').style.display = '';

      const url = data.playStoreUrl || '';
      document.getElementById('update-btn').onclick = () => { if (url) window.open(url, '_blank'); };
      document.getElementById('update-dismiss').onclick = () => {
        document.getElementById('update-banner').classList.remove('show');
        localStorage.setItem(dismissedKey, '1');
      };

      document.getElementById('update-banner').classList.add('show');

      // Notify Android to download OTA in background
      if (typeof window.AndroidOTA !== 'undefined' && data.bundleUrl) {
        window.AndroidOTA.downloadUpdate(
          data.bundleUrl,
          data.bundleHash || '',
          remoteVersion,
          data.otaVersionName || String(remoteVersion)
        );
      }
    });
}

/**
 * Called by Android after OTA download completes
 * Shows "Restart to apply" banner
 */
window.onOtaUpdateReady = function(versionCode, versionName) {
  const banner = document.getElementById('update-banner');
  document.getElementById('update-text').textContent = 'Update ready — restart to apply';
  document.getElementById('update-btn').textContent = 'Restart';
  document.getElementById('update-btn').onclick = function() { location.reload(); };
  document.getElementById('update-dismiss').textContent = 'Later';
  document.getElementById('update-dismiss').style.display = '';
  document.getElementById('update-dismiss').onclick = function() {
    banner.classList.remove('show');
  };
  banner.classList.add('show');
};
