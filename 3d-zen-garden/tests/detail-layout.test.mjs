import test from 'node:test';
import assert from 'node:assert/strict';
import {roofSurfaceAt, roofTilePlan, scatterEllipse, gardenGroundcoverPlan, gardenMeadowPlan, bridgePlankPlan} from '../dist/detail-layout.mjs';

test('roof tiles follow the curved pavilion profile without exceeding its eaves', () => {
  const tiles = roofTilePlan();
  assert.equal(tiles.length, 360);
  assert.ok(tiles.every(tile => tile.x >= -6.46 && tile.x <= -1.52));
  assert.ok(tiles.every(tile => tile.z >= -4.08 && tile.z <= .08));
  assert.ok(tiles.every(tile => Math.abs(tile.y - roofSurfaceAt(tile.z) - .07) < .001));
  assert.ok(new Set(tiles.map(tile => Math.round(tile.y * 100))).size > 5);
});

test('scatter is deterministic, bounded, and handles an empty request', () => {
  const options = {seed: 41, count: 40, x: 3, z: -2, radiusX: 1.8, radiusZ: 1.2, inner: .65};
  const first = scatterEllipse(options);
  assert.deepEqual(first, scatterEllipse(options));
  assert.equal(first.length, 40);
  assert.deepEqual(scatterEllipse({...options, count: 0}), []);
  assert.ok(first.every(point => {
    const distance = ((point.x - 3) / 1.8) ** 2 + ((point.z + 2) / 1.2) ** 2;
    return distance >= .65 ** 2 && distance <= 1;
  }));
  assert.notDeepEqual(first, scatterEllipse({...options, seed: 42}));
});

test('invalid scatter dimensions are rejected before creating geometry', () => {
  assert.throws(() => scatterEllipse({seed: 1, count: -1, x: 0, z: 0, radiusX: 1, radiusZ: 1}), RangeError);
  assert.throws(() => scatterEllipse({seed: 1, count: 5, x: 0, z: 0, radiusX: 0, radiusZ: 1}), RangeError);
});

test('each portfolio landmark has ample bounded groundcover', () => {
  const plan = gardenGroundcoverPlan();
  assert.deepEqual(Object.keys(plan).sort(), ['about', 'contact', 'experience', 'projects', 'toolkit']);
  assert.ok(Object.values(plan).every(points => points.length >= 30));
  assert.ok(Object.values(plan).flat().every(point => Math.abs(point.x) < 7.3 && Math.abs(point.z) < 4.4));
  assert.ok(Object.values(plan).flat().length < 450);
});

test('pond bridge has a low, symmetric arch inside the water footprint', () => {
  const planks = bridgePlankPlan();
  assert.equal(planks.length, 11);
  assert.ok(planks.every(plank => plank.x > 2.8 && plank.x < 5.2 && plank.z === 3.03));
  assert.ok(planks.every(plank => plank.y >= .16 && plank.y < .5));
  assert.ok(Math.abs(planks[0].y - planks.at(-1).y) < 1e-10);
  assert.ok(planks[5].y > planks[0].y);
});

test('broad green spaces fill garden margins without swallowing the stone path', () => {
  const patches = gardenMeadowPlan();
  assert.ok(patches.length >= 6);
  assert.ok(patches.reduce((area, patch) => area + Math.PI * patch.radiusX * patch.radiusZ, 0) > 20);
  assert.ok(patches.every(patch => patch.radiusX > .45 && patch.radiusZ > .35));
  assert.ok(patches.every(patch => Math.abs(patch.x) + patch.radiusX < 7.35 && Math.abs(patch.z) + patch.radiusZ < 4.4));
  const path = [[-2.30,-.12],[-1.48,.22],[-.68,.52],[.20,.72],[.95,1.16],[1.35,1.92],[1.20,2.77],[.63,3.53],[-.14,4.03]];
  assert.ok(patches.every(patch => path.every(([x,z]) => ((x - patch.x) / (patch.radiusX + .23)) ** 2 + ((z - patch.z) / (patch.radiusZ + .23)) ** 2 > 1)));
});
