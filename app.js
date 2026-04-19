import { EventBus } from './core/events.js';
import { Game, LocalStorageAdapter } from './core/game.js';
import { DOMRenderer } from './platforms/web-dom/renderer.js';
import { DOMInput } from './platforms/web-dom/input.js';
import { DIFFICULTY } from './core/constants.js';

/**
 * Minesweeper App - Main application entry point
 * Wires together game logic, renderer, and input
 */

class MinesweeperApp {
  constructor() {
    // Initialize event bus
    this.events = new EventBus();

    // Initialize storage
    this.storage = new LocalStorageAdapter();

    // Load saved difficulty or default to EASY
    this.currentDifficulty = this.storage.getItem('minesweeper-difficulty') || 'EASY';

    // Initialize game with current difficulty
    const difficulty = DIFFICULTY[this.currentDifficulty];
    this.game = new Game(
      this.events,
      difficulty.rows,
      difficulty.cols,
      difficulty.mines,
      this.storage
    );

    // Initialize renderer
    this.renderer = new DOMRenderer();

    // Initialize input
    this.input = new DOMInput(this.events);
  }

  /**
   * Initialize app
   */
  async init() {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Initialize renderer and input
    this.renderer.init();
    this.input.init();

    // Setup difficulty selector
    this._setupDifficultySelector();

    // Wire event handlers
    this._wireEvents();

    // Start game immediately (no reset click needed)
    this.game.start();
  }

  /**
   * Setup difficulty selector
   * @private
   */
  _setupDifficultySelector() {
    const difficultySelect = document.getElementById('difficulty-select');
    if (!difficultySelect) return;

    // Set initial value
    difficultySelect.value = this.currentDifficulty;

    // Handle difficulty change
    difficultySelect.addEventListener('change', (e) => {
      this.currentDifficulty = e.target.value;
      this.storage.setItem('minesweeper-difficulty', this.currentDifficulty);

      // Create new game with new difficulty
      const difficulty = DIFFICULTY[this.currentDifficulty];
      this.game = new Game(
        this.events,
        difficulty.rows,
        difficulty.cols,
        difficulty.mines,
        this.storage
      );

      // Start new game
      this.game.start();
    });
  }

  /**
   * Wire game events to renderer
   * @private
   */
  _wireEvents() {
    // Game started
    this.events.on('game:started', (data) => {
      this.renderer.renderBoard(data.board);
      this.renderer.updateStatus(data.minesRemaining, data.time);

      // Re-render board on window resize to maintain square cells
      const resizeHandler = () => {
        if (this.game.board) {
          this.renderer.renderBoard(this.game.board);
        }
      };
      window.removeEventListener('resize', this._resizeHandler);
      this._resizeHandler = resizeHandler;
      window.addEventListener('resize', resizeHandler);
    });

    // Cell revealed
    this.events.on('cell:revealed', (data) => {
      this.renderer.updateCell(data.cell);
    });

    // Cell flagged
    this.events.on('cell:flagged', (data) => {
      this.renderer.updateCell(data.cell);
      this.renderer.updateStatus(data.minesRemaining, this.game.elapsedTime);
    });

    // Timer tick
    this.events.on('timer:tick', (data) => {
      this.renderer.updateStatus(
        this.game.mineCount - this.game.board.getFlagCount(),
        data.time
      );
    });

    // Game won
    this.events.on('game:won', (data) => {
      this.renderer.showWinModal(data.time, data.bestTime);
      this._setupModalResetButton();
    });

    // Game lost
    this.events.on('game:lost', () => {
      this.renderer.showLoseModal();
      this._setupModalResetButton();
    });

    // Input events
    this.events.on('cell:clicked', (data) => {
      this.game.handleCellClick(data.x, data.y);
    });

    this.events.on('cell:rightclicked', (data) => {
      this.game.handleCellRightClick(data.x, data.y);
    });

    this.events.on('reset:clicked', () => {
      this.game.reset();
    });
  }

  /**
   * Setup modal reset button
   * @private
   */
  _setupModalResetButton() {
    // Wait for modal to be rendered
    setTimeout(() => {
      const modalButton = document.getElementById('modal-new-game');
      if (modalButton) {
        modalButton.addEventListener('click', () => {
          // Hide modal first
          this.renderer.hideModal();
          // Then reset game
          this.game.reset();
        });
      }
    }, 100);
  }
}

// Create and initialize app
const app = new MinesweeperApp();
app.init();
