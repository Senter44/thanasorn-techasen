import test from 'node:test';
import assert from 'node:assert/strict';
import { createState, navigate, setView, toggleMotion, shouldAnimate } from '../dist/garden-state.mjs';

test('garden opens with no panel and respects reduced motion', () => {
  assert.deepEqual(createState(false), {place:null, view:'map', paused:false});
  assert.equal(createState(true).paused, true);
});
test('every destination opens and closes without losing view or motion', () => {
  for (const place of ['projects','experience','about','toolkit','contact']) {
    const initial = createState(true);
    const selected = navigate(initial, place);
    assert.equal(selected.place, place);
    assert.deepEqual(navigate(selected, null), initial);
    assert.equal(initial.place, null);
  }
});
test('unknown destinations leave state unchanged', () => {
  const state = createState(false);
  assert.equal(navigate(state, 'unknown'), state);
});
test('list view preserves destination and rejects unknown modes', () => {
  const state = navigate(createState(false), 'projects');
  assert.deepEqual(setView(state, 'list'), {...state, view:'list'});
  assert.equal(setView(state, 'invalid'), state);
  assert.equal(setView(setView(state, 'list'), 'map').view, 'map');
});
test('manual motion toggle is reversible', () => {
  const state = createState(false);
  assert.equal(toggleMotion(state).paused, true);
  assert.deepEqual(toggleMotion(toggleMotion(state)), state);
});
test('fountain runs only on the visible, unobstructed map', () => {
  const state = createState(false);
  assert.equal(shouldAnimate(state, true), true);
  assert.equal(shouldAnimate(state, false), false);
  assert.equal(shouldAnimate(navigate(state, 'about'), true), false);
  assert.equal(shouldAnimate(setView(state, 'list'), true), false);
  assert.equal(shouldAnimate(toggleMotion(state), true), false);
});
