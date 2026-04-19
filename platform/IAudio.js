/**
 * Audio interface - Contract for audio implementations
 * Platform implementations must implement all methods
 */
export class IAudio {
  /**
   * Initialize audio system
   */
  initialize() {
    throw new Error('IAudio.initialize() not implemented');
  }

  /**
   * Play sound effect
   * @param {string} type - Sound type: 'move', 'merge', 'spawn', 'win', 'lose', 'invalid'
   */
  playSound(type) {
    throw new Error('IAudio.playSound() not implemented');
  }

  /**
   * Set muted state
   * @param {boolean} muted
   */
  setMuted(muted) {
    throw new Error('IAudio.setMuted() not implemented');
  }

  /**
   * Get muted state
   * @returns {boolean}
   */
  isMuted() {
    throw new Error('IAudio.isMuted() not implemented');
  }

  /**
   * Cleanup audio resources
   */
  cleanup() {
    throw new Error('IAudio.cleanup() not implemented');
  }
}
