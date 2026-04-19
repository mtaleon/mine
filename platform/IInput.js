/**
 * Input interface - Contract for input handling implementations
 * Platform implementations must implement all methods
 */
export class IInput {
  /**
   * Initialize input handling
   * @param {Game} game - Game instance to control
   */
  initialize(game) {
    throw new Error('IInput.initialize() not implemented');
  }

  /**
   * Enable input handling
   */
  enable() {
    throw new Error('IInput.enable() not implemented');
  }

  /**
   * Disable input handling
   */
  disable() {
    throw new Error('IInput.disable() not implemented');
  }

  /**
   * Cleanup input resources
   */
  cleanup() {
    throw new Error('IInput.cleanup() not implemented');
  }
}
