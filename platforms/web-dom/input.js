/**
 * DOMInput - Web DOM implementation of IInput
 * Handles desktop (click/right-click) and mobile (tap/long-press) input
 * CRITICAL: Long-press with touchmove cancellation to prevent scroll-triggered flags
 */
export class DOMInput {
  constructor(eventBus) {
    this.events = eventBus;
    this.boardElement = null;
    this.resetButton = null;

    // Long-press state
    this.longPressTimer = null;
    this.longPressConsumed = false;
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchStartCell = null; // Store the cell that was touched
    this.longPressThreshold = 400; // ms - reduced for easier flagging
    this.touchMoveThreshold = 10; // px
    this.lastTouchTime = 0; // Track last touch to prevent click event
    this.preventNextClick = false; // Additional flag to block clicks after long-press
  }

  /**
   * Initialize input handlers
   */
  init() {
    this.boardElement = document.getElementById('board');
    this.resetButton = document.getElementById('reset-button');

    if (!this.boardElement) {
      throw new Error('Board element not found');
    }

    this._setupDesktopInput();
    this._setupMobileInput();
    this._setupResetButton();
  }

  /**
   * Setup desktop input (click, right-click)
   * @private
   */
  _setupDesktopInput() {
    // Left click to reveal
    this.boardElement.addEventListener('click', (e) => {
      // Prevent click if it was triggered by touch event
      if (this.preventNextClick) {
        this.preventNextClick = false;
        return;
      }

      // Ignore synthesized clicks from touch events (within 500ms of last touch)
      const timeSinceTouch = Date.now() - this.lastTouchTime;
      if (timeSinceTouch < 500) {
        return;
      }

      const cell = e.target.closest('.cell');
      if (cell) {
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);
        this.events.emit('cell:clicked', { x, y });
      }
    });

    // Right click to flag
    this.boardElement.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      const cell = e.target.closest('.cell');
      if (cell) {
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);
        this.events.emit('cell:rightclicked', { x, y });
      }
    });
  }

  /**
   * Setup mobile input (tap, long-press)
   * CRITICAL: touchmove cancellation prevents scroll from triggering flags
   * @private
   */
  _setupMobileInput() {
    // Touch start - begin long-press timer
    this.boardElement.addEventListener('touchstart', (e) => {
      const cell = e.target.closest('.cell');
      if (!cell) return;

      const touch = e.touches[0];
      this.touchStartX = touch.clientX;
      this.touchStartY = touch.clientY;
      this.longPressConsumed = false;
      this.touchStartCell = cell; // Store the cell that was touched

      // Start long-press timer
      this.longPressTimer = setTimeout(() => {
        // Long-press triggered - flag the originally touched cell
        if (this.touchStartCell) {
          const x = parseInt(this.touchStartCell.dataset.x, 10);
          const y = parseInt(this.touchStartCell.dataset.y, 10);

          this.longPressConsumed = true;
          this.preventNextClick = true; // Block synthesized click event
          this.events.emit('cell:rightclicked', { x, y });

          // Haptic feedback if available
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }
        }
      }, this.longPressThreshold);
    }, { passive: true });

    // Touch move - cancel long-press if user is scrolling
    this.boardElement.addEventListener('touchmove', (e) => {
      if (!this.longPressTimer) return;

      const touch = e.touches[0];
      const deltaX = Math.abs(touch.clientX - this.touchStartX);
      const deltaY = Math.abs(touch.clientY - this.touchStartY);

      // If moved more than threshold, cancel long-press (user is scrolling)
      if (deltaX > this.touchMoveThreshold || deltaY > this.touchMoveThreshold) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    }, { passive: true });

    // Touch end - reveal if not consumed by long-press
    this.boardElement.addEventListener('touchend', (e) => {
      // Track touch time to prevent synthesized click events
      this.lastTouchTime = Date.now();

      // Cancel long-press timer if still running
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      // If long-press already consumed, don't emit click
      if (this.longPressConsumed) {
        this.longPressConsumed = false;
        this.touchStartCell = null; // Clean up stored cell
        this.preventNextClick = true; // Ensure synthesized click is blocked
        return;
      }

      // Tap - reveal
      const cell = e.target.closest('.cell');
      if (cell) {
        const x = parseInt(cell.dataset.x, 10);
        const y = parseInt(cell.dataset.y, 10);
        this.events.emit('cell:clicked', { x, y });
      }

      // Clean up stored cell
      this.touchStartCell = null;
    });

    // Touch cancel - cleanup
    this.boardElement.addEventListener('touchcancel', () => {
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
      this.longPressConsumed = false;
      this.touchStartCell = null;
    });
  }

  /**
   * Setup reset button
   * @private
   */
  _setupResetButton() {
    if (this.resetButton) {
      this.resetButton.addEventListener('click', () => {
        this.events.emit('reset:clicked');
      });
    }
  }
}
