/**
 * Platform - Dependency injection container for platform components
 * Wires renderer, input, and audio implementations to the game
 */
export class Platform {
  /**
   * @param {IRenderer} renderer
   * @param {IInput} input
   * @param {IAudio} audio
   */
  constructor(renderer, input, audio) {
    this.renderer = renderer;
    this.input = input;
    this.audio = audio;
  }

  /**
   * Initialize all platform components
   * @param {Game} game
   * @param {HTMLElement} container
   */
  initialize(game, container) {
    this.renderer.initialize(container);
    this.input.initialize(game);
    this.audio.initialize();
  }

  /**
   * Cleanup all platform components
   */
  cleanup() {
    this.renderer.cleanup();
    this.input.cleanup();
    this.audio.cleanup();
  }
}
