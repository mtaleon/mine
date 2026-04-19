import { test } from 'node:test';
import assert from 'node:assert';
import { Board } from './board.js';
import { CELL_STATE, SeededRandom } from './constants.js';

test('Board: grid initialization (9x9, 81 cells)', () => {
  const board = new Board(9, 10);
  assert.strictEqual(board.size, 9);
  assert.strictEqual(board.mineCount, 10);
  assert.strictEqual(board.cells.length, 81);
  assert.strictEqual(board.grid.length, 9);
  assert.strictEqual(board.grid[0].length, 9);
});

test('Board: first click cell is never a mine', () => {
  const board = new Board(9, 10);

  // Test multiple positions
  const positions = [[0, 0], [4, 4], [8, 8], [0, 8], [8, 0]];

  for (const [x, y] of positions) {
    const testBoard = new Board(9, 10);
    testBoard.initializeMines(x, y);

    const cell = testBoard.getCellAt(x, y);
    assert.strictEqual(cell.isMine, false, `First click at (${x},${y}) should not be a mine`);
  }
});

test('Board: first click neighbors never have mines', () => {
  const board = new Board(9, 10);

  // Test center position (has 8 neighbors)
  board.initializeMines(4, 4);

  const cell = board.getCellAt(4, 4);
  assert.strictEqual(cell.isMine, false);

  // Check all 8 neighbors
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) continue;
      const neighbor = board.getCellAt(4 + dx, 4 + dy);
      assert.strictEqual(
        neighbor.isMine,
        false,
        `Neighbor at (${4 + dx},${4 + dy}) should not be a mine`
      );
    }
  }
});

test('Board: total mines placed equals mineCount', () => {
  const board = new Board(9, 10);
  board.initializeMines(4, 4);

  const mineCount = board.cells.filter(cell => cell.isMine).length;
  assert.strictEqual(mineCount, 10);
});

test('Board: adjacentMines calculated correctly (center cell)', () => {
  const board = new Board(9, 10);

  // Manually place mines around center cell (4, 4)
  board.getCellAt(3, 3).isMine = true;
  board.getCellAt(4, 3).isMine = true;
  board.getCellAt(5, 3).isMine = true;

  // Recalculate adjacent mines
  const centerCell = board.getCellAt(4, 4);
  centerCell.adjacentMines = board._countAdjacentMines(4, 4);

  assert.strictEqual(centerCell.adjacentMines, 3);
});

test('Board: adjacentMines for corner cell (3 neighbors max)', () => {
  const board = new Board(9, 10);

  // Place mines around corner (0, 0)
  board.getCellAt(1, 0).isMine = true;
  board.getCellAt(0, 1).isMine = true;
  board.getCellAt(1, 1).isMine = true;

  const cornerCell = board.getCellAt(0, 0);
  cornerCell.adjacentMines = board._countAdjacentMines(0, 0);

  assert.strictEqual(cornerCell.adjacentMines, 3);
});

test('Board: adjacentMines for edge cell (5 neighbors max)', () => {
  const board = new Board(9, 10);

  // Place mines around edge cell (4, 0)
  board.getCellAt(3, 0).isMine = true;
  board.getCellAt(5, 0).isMine = true;
  board.getCellAt(3, 1).isMine = true;
  board.getCellAt(4, 1).isMine = true;
  board.getCellAt(5, 1).isMine = true;

  const edgeCell = board.getCellAt(4, 0);
  edgeCell.adjacentMines = board._countAdjacentMines(4, 0);

  assert.strictEqual(edgeCell.adjacentMines, 5);
});

test('Board: flood fill reveals empty area', () => {
  const board = new Board(9, 10);

  // Create a board with no mines (all cells have adjacentMines = 0)
  // This will cause flood fill to reveal entire board
  const result = board.reveal(4, 4);

  assert.strictEqual(result.hit, 'empty');
  assert.ok(result.revealed.length > 1, 'Should reveal multiple cells');
  assert.strictEqual(result.gameOver, false);
});

test('Board: flood fill stops at number boundary', () => {
  const board = new Board(9, 10);

  // Place a mine to create a number boundary
  board.getCellAt(6, 4).isMine = true;

  // Calculate adjacent mines
  board.cells.forEach(cell => {
    if (!cell.isMine) {
      cell.adjacentMines = board._countAdjacentMines(cell.x, cell.y);
    }
  });

  board.initialized = true; // Skip initialization in reveal

  const result = board.reveal(0, 0);

  // Should reveal area but stop at cells adjacent to mine
  assert.strictEqual(result.gameOver, false);

  // Cell (5, 4) should be revealed (adjacent to mine)
  const boundaryCell = board.getCellAt(5, 4);
  assert.strictEqual(boundaryCell.state, CELL_STATE.REVEALED);
  assert.ok(boundaryCell.adjacentMines > 0);

  // Cell (6, 4) is the mine, should not be revealed
  const mineCell = board.getCellAt(6, 4);
  assert.strictEqual(mineCell.state, CELL_STATE.COVERED);
});

test('Board: flood fill never reveals flagged cells', () => {
  const board = new Board(9, 10);

  // Flag a cell before revealing
  board.toggleFlag(3, 3);

  const result = board.reveal(4, 4);

  // The flagged cell should still be flagged, not revealed
  const flaggedCell = board.getCellAt(3, 3);
  assert.strictEqual(flaggedCell.state, CELL_STATE.FLAGGED);
});

test('Board: reveal mine triggers game over', () => {
  const board = new Board(9, 10);

  // Manually place mine and mark as initialized
  const mineCell = board.getCellAt(5, 5);
  mineCell.isMine = true;
  board.initialized = true;

  const result = board.reveal(5, 5);

  assert.strictEqual(result.hit, 'mine');
  assert.strictEqual(result.gameOver, true);
  assert.strictEqual(mineCell.state, CELL_STATE.EXPLODED);
});

test('Board: toggleFlag works correctly', () => {
  const board = new Board(9, 10);

  const result1 = board.toggleFlag(2, 2);
  assert.strictEqual(result1.success, true);
  assert.strictEqual(result1.cell.state, CELL_STATE.FLAGGED);

  const result2 = board.toggleFlag(2, 2);
  assert.strictEqual(result2.success, true);
  assert.strictEqual(result2.cell.state, CELL_STATE.COVERED);
});

test('Board: getFlagCount returns correct count', () => {
  const board = new Board(9, 10);

  assert.strictEqual(board.getFlagCount(), 0);

  board.toggleFlag(0, 0);
  board.toggleFlag(1, 1);
  board.toggleFlag(2, 2);

  assert.strictEqual(board.getFlagCount(), 3);

  board.toggleFlag(1, 1); // Unflag

  assert.strictEqual(board.getFlagCount(), 2);
});

test('Board: hasWon detects win condition', () => {
  const board = new Board(3, 1); // Small board for testing

  // Place one mine
  board.getCellAt(2, 2).isMine = true;
  board.initialized = true;

  // Reveal all non-mine cells
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      const cell = board.getCellAt(x, y);
      if (!cell.isMine) {
        cell.reveal();
      }
    }
  }

  assert.strictEqual(board.hasWon(), true);
});

test('Board: hasWon returns false when cells remain covered', () => {
  const board = new Board(3, 1);

  board.getCellAt(2, 2).isMine = true;
  board.initialized = true;

  // Reveal only some cells
  board.getCellAt(0, 0).reveal();

  assert.strictEqual(board.hasWon(), false);
});

test('Board: revealAllMines reveals only mines', () => {
  const board = new Board(9, 10);
  board.initializeMines(4, 4);

  const mines = board.revealAllMines();

  assert.strictEqual(mines.length, 10);
  mines.forEach(cell => {
    assert.strictEqual(cell.isMine, true);
    assert.strictEqual(cell.state, CELL_STATE.REVEALED);
  });
});

test('Board: seeded random produces reproducible results', () => {
  const seed = 12345;
  const board1 = new Board(9, 10);
  const board2 = new Board(9, 10);

  const rng1 = new SeededRandom(seed);
  const rng2 = new SeededRandom(seed);

  board1.initializeMines(4, 4, rng1);
  board2.initializeMines(4, 4, rng2);

  // Compare mine positions
  for (let i = 0; i < board1.cells.length; i++) {
    assert.strictEqual(
      board1.cells[i].isMine,
      board2.cells[i].isMine,
      `Cells at index ${i} should have same mine state`
    );
  }
});

test('Board: initialization guard prevents duplicate mine placement', () => {
  const board = new Board(9, 10);

  board.initializeMines(4, 4);
  const mineCount1 = board.cells.filter(c => c.isMine).length;

  // Try to initialize again
  board.initializeMines(0, 0);
  const mineCount2 = board.cells.filter(c => c.isMine).length;

  // Mine count should not change
  assert.strictEqual(mineCount1, mineCount2);
  assert.strictEqual(mineCount1, 10);
});

test('Board: assert throws when not enough cells for mines', () => {
  const board = new Board(3, 10); // 9 cells, 10 mines - impossible

  assert.throws(() => {
    board.initializeMines(1, 1); // Safe zone = 9 cells, available = 0
  }, /Not enough cells/);
});
