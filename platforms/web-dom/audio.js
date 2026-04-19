import { IAudio } from '../../platform/IAudio.js';

/**
 * Web DOM Audio - Web Audio API synthesis
 * Synthesizes sound effects with oscillators
 */
export class WebDOMAudio extends IAudio {
  constructor() {
    super();
    this.audioContext = null;
    this.muted = false;
    this.volume = 0.3;
  }

  initialize() {
    // Load muted state from localStorage
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem('2048-muted');
      this.muted = stored === 'true';
    }

    // Lazy initialize AudioContext (browser autoplay policy)
    // Will be created on first sound
  }

  /**
   * Get or create AudioContext (lazy initialization)
   * @private
   */
  _getAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  playSound(type) {
    if (this.muted) return;

    // Lazy initialize on first use
    const ctx = this._getAudioContext();

    switch (type) {
      case 'move':
        this._playMove(ctx);
        break;
      case 'merge':
        this._playMerge(ctx);
        break;
      case 'spawn':
        this._playSpawn(ctx);
        break;
      case 'win':
        this._playWin(ctx);
        break;
      case 'lose':
        this._playLose(ctx);
        break;
      case 'invalid':
        this._playInvalid(ctx);
        break;
    }
  }

  /**
   * Play move sound (subtle tick)
   * @private
   */
  _playMove(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 200;
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.05);
  }

  /**
   * Play merge sound (higher pitch, richer)
   * @private
   */
  _playMerge(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 440;
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.volume * 0.5, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.15);
  }

  /**
   * Play spawn sound (quick pop)
   * @private
   */
  _playSpawn(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 600;
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  }

  /**
   * Play win sound (ascending melody)
   * @private
   */
  _playWin(ctx) {
    const notes = [261.63, 329.63, 392.00, 523.25];  // C-E-G-C (major chord)
    const duration = 0.2;

    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.frequency.value = freq;
      osc.type = 'sine';

      const startTime = ctx.currentTime + (i * duration);
      gain.gain.setValueAtTime(this.volume * 0.4, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  /**
   * Play lose sound (descending tone)
   * @private
   */
  _playLose(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.setValueAtTime(300, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, ctx.currentTime + 0.5);
    osc.type = 'sine';

    gain.gain.setValueAtTime(this.volume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.5);
  }

  /**
   * Play invalid sound (low buzz)
   * @private
   */
  _playInvalid(ctx) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.frequency.value = 100;
    osc.type = 'sawtooth';

    gain.gain.setValueAtTime(this.volume * 0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);

    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.1);
  }

  setMuted(muted) {
    this.muted = muted;

    // Persist to localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('2048-muted', muted.toString());
    }
  }

  isMuted() {
    return this.muted;
  }

  cleanup() {
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}
