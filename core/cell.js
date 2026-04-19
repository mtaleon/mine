import { CELL_STATE } from './constants.js';

/**
 * Cell class - represents a single minesweeper cell
 * Similar to Tile in 2048, but simpler (no movement)
 */
let cellIdCounter = 0;

export class Cell {
  constructor(x, y) {
    this.id = `cell-${cellIdCounter++}`;
    this.x = x;
    this.y = y;
    this.isMine = false;
    this.adjacentMines = 0;
    this.state = CELL_STATE.COVERED;
  }

  /**
   * Reveal this cell
   * @returns {boolean} true if state changed, false otherwise
   */
  reveal() {
    if (this.state !== CELL_STATE.COVERED) return false;
    this.state = CELL_STATE.REVEALED;
    return true;
  }

  /**
   * Toggle flag state (covered <-> flagged)
   * @returns {boolean} true if state changed, false if cell is revealed
   */
  toggleFlag() {
    if (this.state === CELL_STATE.REVEALED || this.state === CELL_STATE.EXPLODED) {
      return false;
    }
    this.state = this.state === CELL_STATE.FLAGGED
      ? CELL_STATE.COVERED
      : CELL_STATE.FLAGGED;
    return true;
  }

  /**
   * Mark cell as exploded (mine clicked)
   */
  explode() {
    this.state = CELL_STATE.EXPLODED;
  }
}

export function createCell(x, y) {
  return new Cell(x, y);
}
