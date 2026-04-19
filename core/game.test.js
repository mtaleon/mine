import { test } from 'node:test';
import assert from 'node:assert';
import { Game, InMemoryStorage } from './game.js';
import { EventBus } from './events.js';

test('Game: initialization', () => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage);

  assert.strictEqual(game.size, 9);
  assert.strictEqual(game.mineCount, 10);
  assert.strictEqual(game.won, false);
  assert.strictEqual(game.lost, false);
  assert.strictEqual(game.board, null);
});

test('Game: start creates board and emits event', (t, done) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage);

  events.on('game:started', (data) => {
    assert.ok(data.board);
    assert.strictEqual(data.minesRemaining, 10);
    assert.strictEqual(data.time, 0);
    done();
  });

  game.start();
  assert.ok(game.board);
});

test('Game: timer does NOT start on game init', (t, done) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage);

  game.start();

  assert.strictEqual(game.startTime, null);
  assert.strictEqual(game.elapsedTime, 0);

  // Wait a bit and check timer hasn't started
  setTimeout(() => {
    assert.strictEqual(game.startTime, null);
    assert.strictEqual(game.elapsedTime, 0);
    done();
  }, 100);
});

test('Game: timer starts on first cell reveal', async (t) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage, 0); // No animation delay

  game.start();

  assert.strictEqual(game.startTime, null);

  await game.handleCellClick(4, 4);

  assert.ok(game.startTime !== null, 'Timer should start on first click');
  assert.ok(game.timerInterval !== null, 'Timer interval should be running');

  game._stopTimer(); // Cleanup
});

test('Game: timer stops on game loss', async (t) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage, 0);

  game.start();

  // Place a mine at (5, 5)
  game.board.getCellAt(5, 5).isMine = true;
  game.board.initialized = true;

  // Start timer by revealing a safe cell first
  await game.handleCellClick(0, 0);
  assert.ok(game.timerInterval !== null);

  // Click on mine
  await game.handleCellClick(5, 5);

  assert.strictEqual(game.lost, true);
  assert.strictEqual(game.timerInterval, null, 'Timer should stop on loss');
});

test('Game: timer stops on game win', async (t) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 3, 1, storage, 0); // Small board

  game.start();

  // Place one mine at corner
  game.board.getCellAt(2, 2).isMine = true;
  game.board.cells.forEach(cell => {
    if (!cell.isMine) {
      cell.adjacentMines = game.board._countAdjacentMines(cell.x, cell.y);
    }
  });
  game.board.initialized = true;

  // Reveal all non-mine cells
  await game.handleCellClick(0, 0);
  assert.ok(game.timerInterval !== null);

  // Continue revealing until win
  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (x !== 2 || y !== 2) {
        await game.handleCellClick(x, y);
      }
    }
  }

  assert.strictEqual(game.won, true);
  assert.strictEqual(game.timerInterval, null, 'Timer should stop on win');
});

test('Game: flag toggle updates mines remaining', (t, done) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage);

  let flagEventCount = 0;

  events.on('cell:flagged', (data) => {
    flagEventCount++;
    if (flagEventCount === 1) {
      assert.strictEqual(data.minesRemaining, 9); // 10 - 1
    } else if (flagEventCount === 2) {
      assert.strictEqual(data.minesRemaining, 8); // 10 - 2
    } else if (flagEventCount === 3) {
      assert.strictEqual(data.minesRemaining, 9); // 10 - 1 (unflagged one)
      done();
    }
  });

  game.start();

  game.handleCellRightClick(0, 0); // Flag
  game.handleCellRightClick(1, 1); // Flag
  game.handleCellRightClick(0, 0); // Unflag
});

test('Game: best time saves to storage', async (t) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 3, 1, storage, 0);

  game.start();

  // Place one mine
  game.board.getCellAt(2, 2).isMine = true;
  game.board.cells.forEach(cell => {
    if (!cell.isMine) {
      cell.adjacentMines = game.board._countAdjacentMines(cell.x, cell.y);
    }
  });
  game.board.initialized = true;

  // Reveal all non-mine cells to win
  await game.handleCellClick(0, 0);

  // Manually set elapsed time for testing
  game.elapsedTime = 42;

  for (let y = 0; y < 3; y++) {
    for (let x = 0; x < 3; x++) {
      if (x !== 2 || y !== 2) {
        await game.handleCellClick(x, y);
      }
    }
  }

  assert.strictEqual(game.won, true);

  // Check storage
  const saved = storage.getItem('minesweeper-best-time');
  assert.ok(saved !== null);
  assert.strictEqual(parseInt(saved, 10), game.elapsedTime);
});

test('Game: best time only updates when new time is better', () => {
  const events = new EventBus();
  const storage = new InMemoryStorage();

  // Set initial best time
  storage.setItem('minesweeper-best-time', '100');

  const game = new Game(events, 9, 10, storage);

  assert.strictEqual(game.bestTime, 100);

  // Update with better time
  game._updateBestTime(50);
  assert.strictEqual(game.bestTime, 50);
  assert.strictEqual(storage.getItem('minesweeper-best-time'), '50');

  // Try to update with worse time
  game._updateBestTime(75);
  assert.strictEqual(game.bestTime, 50, 'Should keep better time');
  assert.strictEqual(storage.getItem('minesweeper-best-time'), '50');
});

test('Game: best time loads correctly on new game', () => {
  const events = new EventBus();
  const storage = new InMemoryStorage();

  storage.setItem('minesweeper-best-time', '123');

  const game = new Game(events, 9, 10, storage);

  assert.strictEqual(game.bestTime, 123);
});

test('Game: seeded game produces reproducible results', async (t) => {
  const seed = 98765;

  const events1 = new EventBus();
  const storage1 = new InMemoryStorage();
  const game1 = new Game(events1, 9, 10, storage1, 0);
  game1.start({ seed });

  const events2 = new EventBus();
  const storage2 = new InMemoryStorage();
  const game2 = new Game(events2, 9, 10, storage2, 0);
  game2.start({ seed });

  // Trigger mine initialization
  await game1.handleCellClick(4, 4);
  await game2.handleCellClick(4, 4);

  // Compare boards
  for (let i = 0; i < game1.board.cells.length; i++) {
    assert.strictEqual(
      game1.board.cells[i].isMine,
      game2.board.cells[i].isMine,
      `Cell ${i} should have same mine state`
    );
  }
});

test('Game: input locked during async operations', async (t) => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage, 50); // With delay

  game.start();

  const promise = game.handleCellClick(4, 4);

  // Input should be locked during operation
  assert.strictEqual(game.inputLocked, true);

  await promise;

  // Input should be unlocked after operation
  assert.strictEqual(game.inputLocked, false);
});

test('Game: reset starts new game', () => {
  const events = new EventBus();
  const storage = new InMemoryStorage();
  const game = new Game(events, 9, 10, storage);

  game.start();
  const firstBoard = game.board;

  game.reset();
  const secondBoard = game.board;

  assert.notStrictEqual(firstBoard, secondBoard);
  assert.strictEqual(game.won, false);
  assert.strictEqual(game.lost, false);
});
