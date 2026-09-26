import test from 'node:test';
import assert from 'node:assert/strict';
import {windLeafPose, WIND_LEAF_COUNT} from '../dist/wind-leaves.mjs';

test('a small set of leaves visibly drifts across the trees', () => {
  assert.ok(WIND_LEAF_COUNT >= 12 && WIND_LEAF_COUNT <= 24);
  for (let index = 0; index < WIND_LEAF_COUNT; index++) {
    const start = windLeafPose(index, 0);
    const later = windLeafPose(index, 1);
    assert.ok(later.x - start.x > .25, `leaf ${index} should travel with the breeze`);
    for (const pose of [start, later]) {
      assert.ok(pose.x >= -8 && pose.x <= 8);
      assert.ok(pose.y >= 1.2 && pose.y <= 4.2);
      assert.ok(pose.z >= -5 && pose.z <= 2);
    }
  }
});

test('leaf paths are deterministic and repeat without drifting off the garden', () => {
  assert.deepEqual(windLeafPose(3, 2), windLeafPose(3, 2));
  assert.deepEqual(windLeafPose(3, 2), windLeafPose(3, 7));
});
