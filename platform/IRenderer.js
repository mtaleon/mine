/**
 * Renderer interface - Contract for rendering implementations
 * Platform implementations must implement all methods
 */
export class IRenderer {
  /**
   * Initialize renderer with container element
   * @param {HTMLElement} container
   */
  initialize(container) {
    throw new Error('IRenderer.initialize() not implemented');
  }

  /**
   * Render entire board
   * @param {Board} board
   */
  renderBoard(board) {
    throw new Error('IRenderer.renderBoard() not implemented');
  }

  /**
   * Animate tile movement
   * @param {Array<Tile>} tiles - All tiles to animate
   */
  animateMove(tiles) {
    throw new Error('IRenderer.animateMove() not implemented');
  }

  /**
   * Animate tile merging
   * @param {Array<object>} merges - Array of { tile, from: [tile1, tile2] }
   */
  animateMerge(merges) {
    throw new Error('IRenderer.animateMerge() not implemented');
  }

  /**
   * Animate new tile spawn
   * @param {Tile} tile
   */
  animateSpawn(tile) {
    throw new Error('IRenderer.animateSpawn() not implemented');
  }

  /**
   * Update score display
   * @param {number} score - Current score
   * @param {number} bestScore - Best score
   */
  updateScore(score, bestScore) {
    throw new Error('IRenderer.updateScore() not implemented');
  }

  /**
   * Cleanup renderer resources
   */
  cleanup() {
    throw new Error('IRenderer.cleanup() not implemented');
  }
}
