import { Cell, createCell } from './cell.js';
import { GAME_CONFIG, CELL_STATE } from './constants.js';

/**
 * Board class managing the minesweeper grid
 * Implements:
 * - Mine placement (avoid first click + 8 neighbors)
 * - Flood fill reveal algorithm (BFS)
 * - Adjacent mine counting
 * - Win/loss detection
 */
export class Board {
  constructor(rows = GAME_CONFIG.gridSize, cols = null, mineCount = GAME_CONFIG.mineCount) {
    // Support both square (size) and rectangular (rows, cols) grids
    this.rows = rows;
    this.cols = cols || rows; // If cols not provided, make it square
    this.size = rows; // Backwards compatibility
    this.mineCount = mineCount;
    this.cells = [];
    this.grid = this._buildGrid();
    this.firstClick = true;
    this.initialized = false; // Guard against duplicate mine placement
  }

  /**
   * Build empty grid of cells
   * @private
   */
  _buildGrid() {
    const grid = [];
    for (let y = 0; y < this.rows; y++) {
      const row = [];
      for (let x = 0; x < this.cols; x++) {
        const cell = createCell(x, y);
        this.cells.push(cell);
        row.push(cell);
      }
      grid.push(row);
    }
    return grid;
  }

  /**
   * Initialize mines AFTER first click (avoid instant loss)
   * Safe zone = clicked cell + 8 neighbors (max 9 cells)
   * @param {number} safeX - First click X coordinate
   * @param {number} safeY - First click Y coordinate
   * @param {SeededRandom|null} rng - Seeded RNG for reproducible games
   */
  initializeMines(safeX, safeY, rng = null) {
    if (this.initialized) return; // Guard against duplicate initialization

    // Get all cells in safe zone (clicked cell + 8 neighbors)
    const safeCells = new Set();
    safeCells.add(this.getCellAt(safeX, safeY).id);

    const neighbors = this._getNeighbors(safeX, safeY);
    neighbors.forEach(cell => safeCells.add(cell.id));

    // Get all available cells (excluding safe zone)
    const availableCells = this.cells.filter(cell => !safeCells.has(cell.id));

    // Assert: must have enough cells to place mines
    if (availableCells.length < this.mineCount) {
      throw new Error(
        `Not enough cells to place ${this.mineCount} mines. ` +
        `Available: ${availableCells.length}, Safe zone: ${safeCells.size}`
      );
    }

    // Place mines randomly
    for (let i = 0; i < this.mineCount; i++) {
      if (availableCells.length === 0) break;

      const rand = rng ? rng.next() : Math.random();
      const index = Math.floor(rand * availableCells.length);
      const cell = availableCells.splice(index, 1)[0];
      cell.isMine = true;
    }

    // Calculate adjacent mine counts for all cells
    this.cells.forEach(cell => {
      if (!cell.isMine) {
        cell.adjacentMines = this._countAdjacentMines(cell.x, cell.y);
      }
    });

    this.initialized = true; // Set flag after successful initialization
  }

  /**
   * Reveal a cell - implements flood fill for empty cells
   * @param {number} x
   * @param {number} y
   * @returns {object} { hit: 'mine'|'number'|'empty', revealed: Cell[], gameOver: boolean }
   */
  reveal(x, y) {
    const cell = this.getCellAt(x, y);

    // Don't reveal if cell doesn't exist, already revealed, or flagged
    // CRITICAL: Flagged cells should never be revealed (UX protection)
    if (!cell || cell.state !== CELL_STATE.COVERED) {
      return { hit: null, revealed: [], gameOver: false };
    }

    // Initialize mines on first click
    if (this.firstClick) {
      this.initializeMines(x, y);
      this.firstClick = false;
    }

    // Hit a mine - game over
    if (cell.isMine) {
      cell.explode();
      return { hit: 'mine', revealed: [cell], gameOver: true };
    }

    // Flood fill reveal
    const revealed = this._floodFillReveal(x, y);

    const hit = cell.adjacentMines > 0 ? 'number' : 'empty';
    return { hit, revealed, gameOver: false };
  }

  /**
   * Flood fill algorithm - reveal all connected empty cells (BFS)
   * @private
   */
  _floodFillReveal(x, y) {
    const revealed = [];
    const queue = [[x, y]];
    const visited = new Set();

    while (queue.length > 0) {
      const [cx, cy] = queue.shift();
      const cell = this.getCellAt(cx, cy);

      if (!cell || visited.has(cell.id)) {
        continue;
      }

      // CRITICAL: Never reveal flagged cells during flood fill
      if (cell.state === CELL_STATE.FLAGGED) {
        continue;
      }

      if (cell.state !== CELL_STATE.COVERED) {
        continue;
      }

      visited.add(cell.id);
      cell.reveal();
      revealed.push(cell);

      // If this cell has no adjacent mines, add neighbors to queue
      if (cell.adjacentMines === 0) {
        const neighbors = this._getNeighbors(cx, cy);
        neighbors.forEach(neighbor => {
          if (!visited.has(neighbor.id) && neighbor.state === CELL_STATE.COVERED && !neighbor.isMine) {
            queue.push([neighbor.x, neighbor.y]);
          }
        });
      }
    }

    return revealed;
  }

  /**
   * Toggle flag on a cell
   * @param {number} x
   * @param {number} y
   * @returns {object} { success: boolean, cell: Cell }
   */
  toggleFlag(x, y) {
    const cell = this.getCellAt(x, y);
    if (!cell) return { success: false, cell: null };

    const success = cell.toggleFlag();
    return { success, cell };
  }

  /**
   * Count adjacent mines around a cell
   * @private
   */
  _countAdjacentMines(x, y) {
    return this._getNeighbors(x, y).filter(cell => cell.isMine).length;
  }

  /**
   * Get all 8 neighbors of a cell
   * @private
   */
  _getNeighbors(x, y) {
    const neighbors = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const cell = this.getCellAt(x + dx, y + dy);
        if (cell) neighbors.push(cell);
      }
    }
    return neighbors;
  }

  /**
   * Check if player has won (all non-mine cells revealed)
   * @returns {boolean}
   */
  hasWon() {
    return this.cells.every(cell =>
      cell.isMine || cell.state === CELL_STATE.REVEALED
    );
  }

  /**
   * Get count of flags placed
   * @returns {number}
   */
  getFlagCount() {
    return this.cells.filter(cell => cell.state === CELL_STATE.FLAGGED).length;
  }

  /**
   * Reveal all mines (for game over display)
   */
  revealAllMines() {
    return this.cells.filter(cell => {
      if (cell.isMine && cell.state !== CELL_STATE.EXPLODED) {
        cell.reveal();
        return true;
      }
      return false;
    });
  }

  /**
   * Get cell at position
   * @param {number} x
   * @param {number} y
   * @returns {Cell|null}
   */
  getCellAt(x, y) {
    if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return null;
    return this.grid[y][x];
  }
}
