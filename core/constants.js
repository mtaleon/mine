// Game configuration
export const GAME_CONFIG = {
  gridSize: 9,           // 9x9 grid for easy difficulty
  mineCount: 10,         // 10 mines for easy difficulty
  animationDuration: 150 // Faster than 2048 since less animation needed
};

// Difficulty presets
export const DIFFICULTY = {
  EASY: { size: 9, mines: 10, label: 'Easy (9×9)', rows: 9, cols: 9 },
  MEDIUM: { size: 16, mines: 40, label: 'Medium (16×16)', rows: 16, cols: 16 },
  HARD: { size: 30, mines: 99, label: 'Hard (30×16)', rows: 16, cols: 30 }
};

// Cell states
export const CELL_STATE = {
  COVERED: 'covered',
  REVEALED: 'revealed',
  FLAGGED: 'flagged',
  EXPLODED: 'exploded'
};

// Visual styling
export const CELL_COLORS = {
  covered: '#bdc3c7',
  revealed: '#ecf0f1',
  flagged: '#e74c3c',
  exploded: '#c0392b',
  mine: '#2c3e50'
};

export const NUMBER_COLORS = {
  1: '#0066ff',  // Bright blue
  2: '#00aa00',  // Green
  3: '#ff0000',  // Red
  4: '#000099',  // Dark blue
  5: '#990000',  // Maroon
  6: '#009999',  // Cyan
  7: '#000000',  // Black
  8: '#808080'   // Gray
};

// SeededRandom class for reproducible games
export class SeededRandom {
  constructor(seed) {
    this.seed = seed;
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
}

// Sleep helper for animations
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
