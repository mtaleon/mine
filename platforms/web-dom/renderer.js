import { CELL_STATE, NUMBER_COLORS, CELL_COLORS } from '../../core/constants.js';

/**
 * UI Text Constants - Octile Universe Tone
 * All modal copy centralized for easy management
 */
const UI_TEXT = {
  WIN_TITLE: 'Completed',
  WIN_TIME: (time) => `Time: ${time}`,
  WIN_BEST: (time) => `Best: ${time}`,

  LOSS_TITLE: 'Game Over',
  LOSS_MESSAGE: 'That was a mine.',

  BUTTON_PLAY_AGAIN: 'Play again',

  PROMO_PREFIX: 'Explore further: ',
  PROMO_LABEL: 'Octile',
  PROMO_URL: 'https://octile.app'
};

/**
 * DOMRenderer - Web DOM implementation of IRenderer
 * Optimized for performance: render board once, update cells individually
 */
export class DOMRenderer {
  constructor() {
    this.boardElement = null;
    this.cellElements = new Map(); // Store cell DOM elements for O(1) lookup
    this.minesRemainingElement = null;
    this.timerElement = null;
    this.modalElement = null;
    this.onNewGame = null; // Callback for new game button
  }

  /**
   * Initialize renderer with DOM elements
   */
  init() {
    this.boardElement = document.getElementById('board');
    this.minesRemainingElement = document.getElementById('mines-remaining');
    this.timerElement = document.getElementById('timer');

    if (!this.boardElement) {
      throw new Error('Board element not found');
    }
  }

  /**
   * Render board - called ONCE on game start
   * Creates grid and stores cell elements in Map
   */
  renderBoard(board) {
    this.boardElement.innerHTML = '';
    this.cellElements.clear();

    // Calculate optimal cell size to fit viewport (more space now with compact controls)
    const maxBoardHeight = window.innerHeight * 0.82; // 82% of viewport height
    const maxBoardWidth = window.innerWidth * 0.92; // 92% of viewport width

    // Account for gap space (1px gaps between cells, 2px padding, 3px border each side)
    const gapSize = 1;
    const padding = 2;
    const border = 3;
    const extraBuffer = 10; // Extra buffer for rounding errors

    const totalVerticalOverhead = (board.rows - 1) * gapSize + padding * 2 + border * 2 + extraBuffer;
    const totalHorizontalOverhead = (board.cols - 1) * gapSize + padding * 2 + border * 2 + extraBuffer;

    const availableHeight = maxBoardHeight - totalVerticalOverhead;
    const availableWidth = maxBoardWidth - totalHorizontalOverhead;

    const cellSizeByHeight = Math.floor(availableHeight / board.rows);
    const cellSizeByWidth = Math.floor(availableWidth / board.cols);
    const cellSize = Math.max(Math.min(cellSizeByHeight, cellSizeByWidth, 60), 16); // Min 16px, max 60px

    // Create CSS Grid with fixed cell sizes (squares)
    this.boardElement.style.display = 'grid';
    this.boardElement.style.gridTemplateColumns = `repeat(${board.cols}, ${cellSize}px)`;
    this.boardElement.style.gridTemplateRows = `repeat(${board.rows}, ${cellSize}px)`;

    // Create cell elements
    for (let y = 0; y < board.rows; y++) {
      for (let x = 0; x < board.cols; x++) {
        const cell = board.getCellAt(x, y);
        const cellElement = this._createCellElement(cell);

        this.boardElement.appendChild(cellElement);
        this.cellElements.set(cell.id, cellElement);
      }
    }
  }

  /**
   * Create a single cell DOM element
   * @private
   */
  _createCellElement(cell) {
    const div = document.createElement('div');
    div.className = 'cell';
    div.dataset.x = cell.x;
    div.dataset.y = cell.y;
    div.dataset.cellId = cell.id;

    // Set initial state
    this._updateCellElement(div, cell);

    return div;
  }

  /**
   * Update a single cell - O(1) lookup, efficient updates
   * This is called for every reveal/flag, NOT renderBoard
   */
  updateCell(cell) {
    const cellElement = this.cellElements.get(cell.id);
    if (!cellElement) return;

    this._updateCellElement(cellElement, cell);
  }

  /**
   * Update cell element appearance based on state
   * @private
   */
  _updateCellElement(element, cell) {
    // Clear previous classes and inline styles
    element.className = 'cell';
    element.style.color = '';
    element.innerHTML = '';

    switch (cell.state) {
      case CELL_STATE.COVERED:
        element.classList.add('covered');
        break;

      case CELL_STATE.REVEALED:
        element.classList.add('revealed');

        if (cell.isMine) {
          element.classList.add('mine');
          element.innerHTML = `
            <svg viewBox="0 0 24 24" width="70%" height="70%">
              <circle cx="12" cy="12" r="6" fill="currentColor"/>
              <rect x="11" y="4" width="2" height="5" fill="currentColor"/>
              <rect x="11" y="15" width="2" height="5" fill="currentColor"/>
              <rect x="4" y="11" width="5" height="2" fill="currentColor"/>
              <rect x="15" y="11" width="5" height="2" fill="currentColor"/>
              <rect x="6.5" y="6.5" width="2" height="4" fill="currentColor" transform="rotate(45 7.5 8.5)"/>
              <rect x="15.5" y="6.5" width="2" height="4" fill="currentColor" transform="rotate(-45 16.5 8.5)"/>
              <rect x="6.5" y="13.5" width="2" height="4" fill="currentColor" transform="rotate(-45 7.5 15.5)"/>
              <rect x="15.5" y="13.5" width="2" height="4" fill="currentColor" transform="rotate(45 16.5 15.5)"/>
              <circle cx="9" cy="9" r="1.5" fill="white" opacity="0.4"/>
            </svg>
          `;
        } else if (cell.adjacentMines > 0) {
          element.textContent = cell.adjacentMines;
          element.style.color = NUMBER_COLORS[cell.adjacentMines];
          element.classList.add(`number-${cell.adjacentMines}`);
        } else {
          // CRITICAL: Empty cells show NO text (not "0")
          element.textContent = '';
        }
        break;

      case CELL_STATE.FLAGGED:
        element.classList.add('flagged');
        element.innerHTML = `
          <svg viewBox="0 0 24 24" width="75%" height="75%">
            <rect x="6" y="4" width="2" height="16" fill="#2c3e50"/>
            <circle cx="7" cy="20" r="1.5" fill="#2c3e50"/>
            <path d="M 8 5 L 18 8 L 8 12 Z" fill="#e74c3c"/>
            <path d="M 8 5 L 18 8 L 8 12 Z" fill="#c0392b" opacity="0.3" transform="translate(0.5, 0.5)"/>
          </svg>
        `;
        break;

      case CELL_STATE.EXPLODED:
        element.classList.add('exploded');
        element.innerHTML = `
          <svg viewBox="0 0 24 24" width="80%" height="80%">
            <circle cx="12" cy="12" r="5" fill="#2c3e50"/>
            <circle cx="12" cy="12" r="3" fill="#e74c3c"/>
            <polygon points="12,2 13,8 11,8" fill="#ff6b6b"/>
            <polygon points="12,22 13,16 11,16" fill="#ff6b6b"/>
            <polygon points="2,12 8,13 8,11" fill="#ff6b6b"/>
            <polygon points="22,12 16,13 16,11" fill="#ff6b6b"/>
            <polygon points="5,5 9,10 7,10" fill="#feca57" transform="rotate(-45 7 7.5)"/>
            <polygon points="19,5 15,10 17,10" fill="#feca57" transform="rotate(45 17 7.5)"/>
            <polygon points="5,19 9,14 7,14" fill="#feca57" transform="rotate(45 7 16.5)"/>
            <polygon points="19,19 15,14 17,14" fill="#feca57" transform="rotate(-45 17 16.5)"/>
          </svg>
        `;
        break;
    }
  }

  /**
   * Update game status (mines remaining, timer)
   */
  updateStatus(minesRemaining, time) {
    if (this.minesRemainingElement) {
      this.minesRemainingElement.textContent = minesRemaining;
    }

    if (this.timerElement) {
      this.timerElement.textContent = this._formatTime(time);
    }
  }

  /**
   * Format time as MM:SS
   * @private
   */
  _formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Show win modal - Octile Universe style
   */
  showWinModal(time, bestTime) {
    const formattedTime = this._formatTime(time);
    const formattedBestOld = bestTime != null ? this._formatTime(bestTime) : '--:--';

    // CRITICAL: bestTime is treated as "previous best"
    const isBestTime = (bestTime == null) || (time < bestTime);
    const bestToShow = isBestTime ? formattedTime : formattedBestOld;

    const lines = [
      UI_TEXT.WIN_TIME(formattedTime),  // Always show current time
      UI_TEXT.WIN_BEST(bestToShow)       // Always show best (either new or old)
    ];

    this._showModal({
      kind: 'win',
      title: UI_TEXT.WIN_TITLE,
      lines: lines
    });
  }

  /**
   * Show lose modal - Octile Universe style
   */
  showLoseModal() {
    this._showModal({
      kind: 'lose',
      title: UI_TEXT.LOSS_TITLE,
      lines: [UI_TEXT.LOSS_MESSAGE]
    });
  }

  /**
   * Show modal using DOM API - Octile Universe style
   * @private
   */
  _showModal({ kind, title, lines }) {
    // Remove existing modal if any
    this._hideModal();

    const modal = document.createElement('div');
    modal.className = 'modal';

    const modalContent = document.createElement('div');
    modalContent.className = 'modal-content';

    // Create title
    const titleEl = document.createElement('h2');
    titleEl.textContent = title;  // Safe, no XSS
    modalContent.appendChild(titleEl);

    // Create message lines (use <p>, not <br>)
    lines.forEach(line => {
      const p = document.createElement('p');
      p.className = 'modal-line';
      p.textContent = line;
      modalContent.appendChild(p);
    });

    // Add Octile promo ONLY on win
    if (kind === 'win') {
      const promo = document.createElement('p');
      promo.className = 'octile-promo';

      const prefix = document.createElement('span');
      prefix.textContent = UI_TEXT.PROMO_PREFIX;  // "Explore further: "
      promo.appendChild(prefix);

      const link = document.createElement('a');
      link.href = UI_TEXT.PROMO_URL;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';  // Security
      link.textContent = UI_TEXT.PROMO_LABEL;  // "Octile"
      promo.appendChild(link);

      modalContent.appendChild(promo);
    }

    // Create button and bind once per creation
    const button = document.createElement('button');
    button.id = 'modal-new-game';
    button.type = 'button';
    button.textContent = UI_TEXT.BUTTON_PLAY_AGAIN;

    // Bind click directly (prevents duplicate listeners)
    button.addEventListener('click', () => {
      modal.classList.remove('show');
      // Wait for animation to complete before removing
      setTimeout(() => {
        this._hideModal();
        this.onNewGame?.();  // Callback pattern
      }, 300);
    });

    modalContent.appendChild(button);
    modal.appendChild(modalContent);

    document.body.appendChild(modal);
    this.modalElement = modal;

    // Fade in
    setTimeout(() => modal.classList.add('show'), 10);
  }

  /**
   * Set callback for new game button
   */
  setNewGameHandler(fn) {
    this.onNewGame = fn;
  }

  /**
   * Hide modal
   */
  hideModal() {
    if (this.modalElement) {
      this.modalElement.remove();
      this.modalElement = null;
    }
  }

  /**
   * Hide modal (private alias for internal use)
   * @private
   */
  _hideModal() {
    this.hideModal();
  }
}
