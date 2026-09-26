import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveTheme, toggleTheme, themeButtonLabel} from '../dist/theme-state.mjs';

test('saved light or dark choice wins over the device setting', () => {
  assert.equal(resolveTheme('light', true), 'light');
  assert.equal(resolveTheme('dark', false), 'dark');
});

test('missing or invalid choice follows the device setting', () => {
  assert.equal(resolveTheme(null, true), 'dark');
  assert.equal(resolveTheme(undefined, false), 'light');
  assert.equal(resolveTheme('unexpected', true), 'dark');
});

test('toggle is reversible and button names the next mode', () => {
  assert.equal(toggleTheme('light'), 'dark');
  assert.equal(toggleTheme('dark'), 'light');
  assert.equal(themeButtonLabel('light'), 'Switch to dark mode');
  assert.equal(themeButtonLabel('dark'), 'Switch to light mode');
});
