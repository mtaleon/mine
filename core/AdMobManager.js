/**
 * AdMobManager - Orchestrates AdMob integration with ultra-conservative approach
 *
 * Philosophy: Better to under-monetize than destroy calm UX (Octile Universe)
 * - Banner: Always visible (structural furniture, not intrusive)
 * - Interstitial: Max 1 per session, only after game completion
 * - Error handling: All failures silent, never block user flow
 *
 * v1.0: Interstitial ads disabled (interstitial_ads: false), banner only
 * v1.1+: Enable interstitials via config flag
 *
 * Android-only: AdMob features only active on Android native platform
 */

import { AdMob } from '@capacitor-community/admob';
import { AdMobPlatform } from '../platform/AdMobPlatform.js';
import { SessionManager } from './SessionManager.js';

// Ad Unit Configuration
const TEST_IDS = {
  banner: 'ca-app-pub-3940256099942544/6300978111',
  interstitial: 'ca-app-pub-3940256099942544/1033173712'
};

const PROD_IDS = {
  banner: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX', // Replace with real ID
  interstitial: 'ca-app-pub-XXXXXXXXXXXXXXXX/XXXXXXXXXX' // Replace with real ID
};

const isDev = window.location.hostname === 'localhost' ||
              window.location.hostname.includes('127.0.0.1');
const AD_UNITS = isDev ? TEST_IDS : PROD_IDS;

export class AdMobManager {
  constructor(eventBus, config) {
    this.eventBus = eventBus;
    this.config = config;

    // Pass ad unit IDs to platform
    this.platform = new AdMobPlatform(AD_UNITS);
    this.sessionManager = new SessionManager();

    this.adsEnabled = false;
    this.initialized = false;
    this.loadFailures = 0;

    // Store ad unit IDs for interstitial use
    this.adUnitIds = AD_UNITS;

    // Set up event listeners for modal state
    this._setupEventListeners();
  }

  /**
   * Initialize AdMob (call after main screen renders)
   *
   * ⚠️ CRITICAL: Consent is handled inside platform.initialize()
   * Banner must wait until this completes to avoid UI flash/jump
   */
  async initialize() {
    this.adsEnabled = await this.platform.initialize();

    if (this.adsEnabled) {
      this.initialized = true;
      // Show banner after consent resolved
      await this.showBanner();
    }

    return this.adsEnabled;
  }

  /**
   * Event-driven banner visibility (modal-aware)
   * Listens to modal:opened and modal:closed events from EventBus
   */
  _setupEventListeners() {
    // Hide banner when modals open
    this.eventBus.on('modal:opened', () => {
      this.hideBanner();
    });

    // Show banner when modals close
    this.eventBus.on('modal:closed', () => {
      this.showBanner();
    });
  }

  /**
   * Show banner ad
   */
  async showBanner() {
    if (!this.adsEnabled || !this.initialized) return;

    try {
      await this.platform.showBanner();
      // Reset failure count on success
      this.loadFailures = 0;
    } catch (error) {
      console.warn('Banner load failed:', error);

      // Ensure layout returns to normal if banner fails (native overlay)
      document.documentElement.style.setProperty('--ad-safe-bottom', '0px');

      // Increment failure count
      this.loadFailures++;
      if (this.loadFailures >= 3) {
        console.warn('Disabling ads after 3 consecutive failures');
        this.adsEnabled = false;
      }
    }
  }

  /**
   * Hide banner ad
   */
  async hideBanner() {
    if (!this.adsEnabled || !this.initialized) return;
    await this.platform.hideBanner();
  }

  /**
   * Handle game completion (MUST be awaited before showing completion modal)
   * Always resolves quickly (2-5 seconds max) even if ad fails
   *
   * v1.0: interstitial_ads: false, so this returns immediately
   * v1.1+: Enable via config flag
   */
  async onGameCompleted() {
    // Track game completion metric (for analytics)
    this._updateMetrics('game_completed');

    // v1.0: Return early if interstitials disabled
    if (!this.config?.features?.interstitial_ads) {
      return;
    }

    if (!this.adsEnabled) return;

    // Increment games FIRST, then check
    this.sessionManager.incrementGames();

    // Check if we should show interstitial
    if (this.sessionManager.canShowInterstitial()) {
      try {
        await this._showInterstitialWithTimeout();
        this.sessionManager.markInterstitialShown();
        this._updateMetrics('interstitial_shown');
      } catch (error) {
        console.warn('Interstitial failed:', error);
        // Continue normally - never block user flow
      }
    }
  }

  /**
   * Show interstitial with proper listener cleanup and timeout
   *
   * CRITICAL: Must remove listeners to prevent memory leak
   * Uses handle.remove() method (Capacitor PluginListenerHandle pattern)
   */
  async _showInterstitialWithTimeout() {
    if (!this.adsEnabled) return;

    return new Promise((resolve) => {
      // 5-second timeout (fail-safe)
      const timeout = setTimeout(() => {
        console.warn('Interstitial timeout');
        resolve();
      }, 5000);

      // Prepare and show interstitial
      AdMob.prepareInterstitial({
        adId: this.adUnitIds.interstitial
      }).then(() => {
        // Create listener handles for cleanup
        let dismissedHandle, failedHandle;

        const cleanup = () => {
          clearTimeout(timeout);

          // Remove listeners using handle.remove() method
          if (dismissedHandle) dismissedHandle.remove();
          if (failedHandle) failedHandle.remove();

          resolve();
        };

        // Register one-time listeners with cleanup
        dismissedHandle = AdMob.addListener('onInterstitialAdDismissed', cleanup);
        failedHandle = AdMob.addListener('onInterstitialAdFailedToShow', cleanup);

        // Show interstitial
        AdMob.showInterstitial();
      }).catch((error) => {
        clearTimeout(timeout);
        console.warn('Interstitial prepare failed:', error);
        resolve(); // Fail gracefully
      });
    });
  }

  /**
   * Track metrics for analytics
   */
  _updateMetrics(eventType) {
    try {
      const metrics = JSON.parse(
        localStorage.getItem('octile:mine:admob_metrics') ||
        '{"totalGames":0,"totalSessions":0,"totalInterstitialsSeen":0}'
      );

      if (eventType === 'game_completed') {
        metrics.totalGames++;
      }

      if (eventType === 'interstitial_shown') {
        metrics.totalInterstitialsSeen++;
      }

      if (eventType === 'session_start') {
        metrics.totalSessions++;
      }

      localStorage.setItem('octile:mine:admob_metrics', JSON.stringify(metrics));
    } catch (e) {
      console.warn('Failed to update metrics:', e);
    }
  }

  /**
   * Get current state (for debugging)
   */
  getState() {
    return {
      adsEnabled: this.adsEnabled,
      initialized: this.initialized,
      loadFailures: this.loadFailures,
      interstitialsEnabled: this.config?.features?.interstitial_ads || false,
      session: this.sessionManager.getState()
    };
  }
}
