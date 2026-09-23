import test from 'node:test';
import assert from 'node:assert/strict';
import {sampleSurface, rockRelief} from '../dist/surface-pattern.mjs';

test('surface samples are deterministic and stay within texture byte bounds', () => {
  for (const kind of ['sand', 'stone', 'wood', 'roof', 'moss', 'soil', 'water']) {
    const first = sampleSurface(kind, -13.25, 287.5);
    assert.deepEqual(first, sampleSurface(kind, -13.25, 287.5));
    for (const value of Object.values(first)) assert.ok(Number.isFinite(value) && value >= 0 && value <= 255);
  }
});

test('stone has natural tonal variation rather than one flat gray', () => {
  const samples = Array.from({length: 64}, (_, i) => sampleSurface('stone', i % 8 * 23, Math.floor(i / 8) * 23));
  assert.ok(new Set(samples.map(sample => sample.bump)).size > 25);
  assert.ok(Math.max(...samples.map(sample => sample.r)) - Math.min(...samples.map(sample => sample.r)) > 15);
  assert.ok(samples.every(sample => Math.max(sample.r, sample.g, sample.b) - Math.min(sample.r, sample.g, sample.b) < 35));
});

test('pond surface is blue-green with subtle changing color', () => {
  const samples = Array.from({length: 36}, (_, i) => sampleSurface('water', i % 6 * 31, Math.floor(i / 6) * 31));
  assert.ok(samples.every(sample => sample.g >= sample.r && sample.b >= sample.r));
  assert.ok(new Set(samples.map(sample => sample.g)).size > 10);
});

test('rock relief varies within a restrained range, including negative coordinates', () => {
  const values = Array.from({length: 50}, (_, i) => rockRelief(i * .17 - 3, i * .29 - 5, i * .13, 41));
  assert.ok(values.every(value => Number.isFinite(value) && value >= -1 && value <= 1));
  assert.ok(Math.max(...values) - Math.min(...values) > .2);
  assert.equal(rockRelief(-1, 2, -3, 41), rockRelief(-1, 2, -3, 41));
});
