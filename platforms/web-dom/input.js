/**
 * DOMInput - Web DOM implementation of IInput
 * Handles desktop (click/right-click) and mobile (tap/long-press) input
 * Uses Pointer Events for reliable cross-platform touch handling
 * CRITICAL: Aggressive ghost click prevention for iOS Safari
 */
export class DOMInput {
  constructor(eventBus) {
    this.events = eventBus;
    this.boardElement = null;
    this.resetButton = null;

    // Pointer Events state
    this.longPressTimer = null;
    this.longPressConsumed = false;
    this.startX = 0;
    this.startY = 0;
    this.startCell = null; // {x, y} coordinates of touched cell
    this.activePointerId = null; // Track which pointer is active
    this.preventNextClick = false; // Block ghost clicks

    // Tuning parameters
    this.longPressThreshold = 450; // ms - standard long-press duration
    this.moveCancelPx = 12; // px - movement threshold
    this.moveCancelPx2 = this.moveCancelPx * this.moveCancelPx; // squared for efficiency
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

    this._setupGhostClickBlocker();
    this._setupContextMenu();
    this._setupPointerInput();
    this._setupResetButton();
  }

  /**
   * Cleanup gesture state
   * @private
   */
  _cleanup() {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    this.longPressConsumed = false;
    this.activePointerId = null;
    this.startCell = null;
  }

  /**
   * Setup ghost click blocker (capture phase)
   * CRITICAL: Blocks iOS Safari ghost clicks in capture phase before they reach other handlers
   * @private
   */
  _setupGhostClickBlocker() {
    this.boardElement.addEventListener('click', (e) => {
      if (!this.preventNextClick) return;

      e.preventDefault();
      e.stopPropagation();
      this.preventNextClick = false;
    }, true); // capture = true, runs before bubble phase
  }

  /**
   * Setup context menu (right-click to flag)
   * @private
   */
  _setupContextMenu() {
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
   * Setup Pointer Events input (tap, long-press, mouse)
   * Uses Pointer Events for unified mouse/touch/pen handling
   * CRITICAL: Tracks pointerId to avoid multi-touch interference
   * @private
   */
  _setupPointerInput() {
    // Pointer down - start long-press timer
    this.boardElement.addEventListener('pointerdown', (e) => {
      // Only track one pointer at a time (primary touch/mouse)
      if (this.activePointerId !== null) return;

      const cell = e.target.closest('.cell');
      if (!cell) {
        this._cleanup();
        return;
      }

      // Capture this pointer
      this.activePointerId = e.pointerId;
      this.startX = e.clientX;
      this.startY = e.clientY;
      this.startCell = {
        x: parseInt(cell.dataset.x, 10),
        y: parseInt(cell.dataset.y, 10)
      };
      this.longPressConsumed = false;

      // Start long-press timer
      this.longPressTimer = setTimeout(() => {
        if (!this.startCell) return;

        // Long-press triggered - flag the original cell
        this.longPressConsumed = true;
        this.preventNextClick = true;
        this.events.emit('cell:rightclicked', this.startCell);

        // Haptic feedback
        if (navigator.vibrate) {
          navigator.vibrate(10);
        }
      }, this.longPressThreshold);
    });

    // Pointer move - cancel long-press if moved too much (user is scrolling)
    this.boardElement.addEventListener('pointermove', (e) => {
      if (e.pointerId !== this.activePointerId) return;
      if (!this.startCell || !this.longPressTimer) return;

      // Use squared distance for efficiency (avoids Math.sqrt)
      const dx = e.clientX - this.startX;
      const dy = e.clientY - this.startY;
      const distSq = dx * dx + dy * dy;

      if (distSq > this.moveCancelPx2) {
        // Movement exceeded threshold - cancel long-press
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }
    });

    // Pointer up - reveal if not consumed by long-press
    this.boardElement.addEventListener('pointerup', (e) => {
      if (e.pointerId !== this.activePointerId) return;

      // Cancel timer if still running
      if (this.longPressTimer) {
        clearTimeout(this.longPressTimer);
        this.longPressTimer = null;
      }

      if (!this.startCell) {
        this._cleanup();
        return;
      }

      if (this.longPressConsumed) {
        // Long-press already handled - prevent any further action
        e.preventDefault();
        this._cleanup();
        return;
      }

      // Normal tap/click - reveal cell
      this.events.emit('cell:clicked', this.startCell);
      this._cleanup();
    });

    // Pointer cancel - system interrupted (call, notification, etc)
    this.boardElement.addEventListener('pointercancel', (e) => {
      if (e.pointerId !== this.activePointerId) return;
      this._cleanup();
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
