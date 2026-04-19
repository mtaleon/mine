import { Board } from './board.js';
import { GAME_CONFIG, SeededRandom } from './constants.js';

/**
 * In-memory storage (fallback when localStorage unavailable)
 */
export class InMemoryStorage {
  constructor() {
    this.data = {};
  }
  getItem(key) {
    return this.data[key] || null;
  }
  setItem(key, value) {
    this.data[key] = value;
  }
}

/**
 * LocalStorage adapter
 */
export class LocalStorageAdapter {
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

/**
 * Game class managing minesweeper game lifecycle
 * Storage adapter pattern and async operations
 */
export class Game {
  constructor(
    eventBus,
    rows = GAME_CONFIG.gridSize,
    cols = null,
    mineCount = GAME_CONFIG.mineCount,
    storage = null,
    animationDelay = GAME_CONFIG.animationDuration
  ) {
    this.board = null;
    this.rows = rows;
    this.cols = cols || rows; // Square grid if cols not provided
    this.size = rows; // Backwards compatibility
    this.mineCount = mineCount;
    this.won = false;
    this.lost = false;
    this.inputLocked = false;

    this.storage = storage || new InMemoryStorage();
    this.bestTime = this._loadBestTime();

    this.animationDelay = animationDelay;
    this.events = eventBus;

    // Timer
    this.startTime = null;
    this.elapsedTime = 0;
    this.timerInterval = null;

    // Seeded RNG
    this.seed = null;
    this.rng = null;
  }

  /**
   * Start new game
   * @param {object} options - { seed: number } for reproducible games
   */
  start(options = {}) {
    this.seed = options.seed || null;
    this.rng = this.seed ? new SeededRandom(this.seed) : null;

    this.board = new Board(this.rows, this.cols, this.mineCount);
    this.won = false;
    this.lost = false;
    this.inputLocked = false;

    // Timer (will start on first click)
    this.startTime = null;
    this.elapsedTime = 0;
    this._stopTimer();

    this.events.emit('game:started', {
      board: this.board,
      minesRemaining: this.mineCount,
      time: 0
    });
  }

  /**
   * Handle cell click (reveal)
   * @param {number} x
   * @param {number} y
   */
  async handleCellClick(x, y) {
    if (this.inputLocked || this.won || this.lost) return;

    // Start timer on first click
    if (this.board.firstClick && !this.startTime) {
      this._startTimer();
    }

    this.inputLocked = true;

    const result = this.board.reveal(x, y);

    if (result.revealed.length > 0) {
      // Emit events for each revealed cell
      for (const cell of result.revealed) {
        this.events.emit('cell:revealed', { cell });
        if (this.animationDelay > 0 && result.revealed.length > 5) {
          await new Promise(resolve => setTimeout(resolve, 5)); // Faster delay for flood fill
        }
      }
    }

    if (result.gameOver) {
      // Hit a mine - game over
      this.lost = true;
      this._stopTimer();

      // Reveal all mines
      const mines = this.board.revealAllMines();
      for (const cell of mines) {
        this.events.emit('cell:revealed', { cell });
      }

      this.events.emit('game:lost', {
        time: this.elapsedTime
      });
    } else if (this.board.hasWon()) {
      // Won the game!
      this.won = true;
      this._stopTimer();

      const time = this.elapsedTime;
      const bestTime = this._updateBestTime(time);

      this.events.emit('game:won', {
        time,
        bestTime
      });
    }

    this.inputLocked = false;
  }

  /**
   * Handle cell right-click (flag toggle)
   * @param {number} x
   * @param {number} y
   */
  handleCellRightClick(x, y) {
    if (this.inputLocked || this.won || this.lost) return;

    const result = this.board.toggleFlag(x, y);

    if (result.success) {
      const minesRemaining = this.mineCount - this.board.getFlagCount();

      this.events.emit('cell:flagged', {
        cell: result.cell,
        minesRemaining
      });
    }
  }

  /**
   * Reset/restart game
   */
  reset() {
    this.start({ seed: this.seed });
  }

  /**
   * Start timer
   * @private
   */
  _startTimer() {
    this.startTime = Date.now();
    this.elapsedTime = 0;

    this.timerInterval = setInterval(() => {
      this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
      this.events.emit('timer:tick', { time: this.elapsedTime });
    }, 1000);
  }

  /**
   * Stop timer
   * @private
   */
  _stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  /**
   * Load best time from storage
   * @private
   */
  _loadBestTime() {
    const key = `minesweeper-best-time-${this.rows}x${this.cols}-${this.mineCount}`;
    const stored = this.storage.getItem(key);
    return stored ? parseInt(stored, 10) : null;
  }

  /**
   * Update best time if new time is better
   * @private
   */
  _updateBestTime(time) {
    if (this.bestTime === null || time < this.bestTime) {
      this.bestTime = time;
      const key = `minesweeper-best-time-${this.rows}x${this.cols}-${this.mineCount}`;
      this.storage.setItem(key, time.toString());
    }
    return this.bestTime;
  }
}
