import { test } from 'node:test';
import assert from 'node:assert';
import { Cell, createCell } from './cell.js';
import { CELL_STATE } from './constants.js';

test('Cell: initial state', () => {
  const cell = createCell(2, 3);
  assert.strictEqual(cell.x, 2);
  assert.strictEqual(cell.y, 3);
  assert.strictEqual(cell.isMine, false);
  assert.strictEqual(cell.adjacentMines, 0);
  assert.strictEqual(cell.state, CELL_STATE.COVERED);
  assert.ok(cell.id.startsWith('cell-'));
});

test('Cell: reveal transition (covered → revealed)', () => {
  const cell = createCell(0, 0);
  assert.strictEqual(cell.state, CELL_STATE.COVERED);

  const changed = cell.reveal();
  assert.strictEqual(changed, true);
  assert.strictEqual(cell.state, CELL_STATE.REVEALED);
});

test('Cell: reveal already revealed cell (no change)', () => {
  const cell = createCell(0, 0);
  cell.reveal();

  const changed = cell.reveal();
  assert.strictEqual(changed, false);
  assert.strictEqual(cell.state, CELL_STATE.REVEALED);
});

test('Cell: flag toggle (covered → flagged → covered)', () => {
  const cell = createCell(0, 0);
  assert.strictEqual(cell.state, CELL_STATE.COVERED);

  // First toggle: covered → flagged
  let changed = cell.toggleFlag();
  assert.strictEqual(changed, true);
  assert.strictEqual(cell.state, CELL_STATE.FLAGGED);

  // Second toggle: flagged → covered
  changed = cell.toggleFlag();
  assert.strictEqual(changed, true);
  assert.strictEqual(cell.state, CELL_STATE.COVERED);
});

test('Cell: cannot flag revealed cell', () => {
  const cell = createCell(0, 0);
  cell.reveal();

  const changed = cell.toggleFlag();
  assert.strictEqual(changed, false);
  assert.strictEqual(cell.state, CELL_STATE.REVEALED);
});

test('Cell: cannot flag exploded cell', () => {
  const cell = createCell(0, 0);
  cell.explode();

  const changed = cell.toggleFlag();
  assert.strictEqual(changed, false);
  assert.strictEqual(cell.state, CELL_STATE.EXPLODED);
});

test('Cell: explode transition', () => {
  const cell = createCell(0, 0);
  cell.explode();
  assert.strictEqual(cell.state, CELL_STATE.EXPLODED);
});

test('Cell: unique IDs', () => {
  const cell1 = createCell(0, 0);
  const cell2 = createCell(0, 0);
  assert.notStrictEqual(cell1.id, cell2.id);
});
