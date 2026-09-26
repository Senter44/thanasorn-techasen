import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installTreeWind, WIND_GUST_STRENGTH} from '../dist/tree-wind.mjs';

function compile(material) {
  const shader = {uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>'};
  material.onBeforeCompile(shader);
  return shader;
}

test('wind passes across each tree crown and updates its shadow with one shared clock', () => {
  assert.ok(WIND_GUST_STRENGTH >= .28, 'tree motion must remain visible from the default camera');
  const materials = [{name: 'Japanese foliage 00'}, {name: 'Japanese foliage 01'}];
  const canopy = {isMesh: true, material: materials};
  const depthMaterial = {};
  const wind = installTreeWind(canopy, depthMaterial);

  assert.equal(canopy.customDepthMaterial, depthMaterial);
  for (const material of [...materials, depthMaterial]) {
    const shader = compile(material);
    assert.match(shader.vertexShader, /uniform float treeWindTime/);
    assert.match(shader.vertexShader, /transformed\.x \+=/);
    assert.match(shader.vertexShader, /position\.x/);
    assert.strictEqual(shader.uniforms.treeWindTime, wind.uniform);
  }
  wind.setTime(2.5);
  assert.equal(wind.uniform.value, 2.5);
});

test('missing foliage leaves the garden unchanged', () => {
  assert.equal(installTreeWind(null, {}), null);
  assert.equal(installTreeWind({isMesh: false}, {}), null);
});

test('shipped garden model contains the canopy that receives wind', () => {
  const model = readFileSync(new URL('../dist/assets/garden.glb', import.meta.url));
  const jsonLength = model.readUInt32LE(12);
  const gltf = JSON.parse(model.subarray(20, 20 + jsonLength).toString());
  const canopy = gltf.nodes.find(node => node.name === 'Perimeter_Japanese_foliage_00');
  assert.ok(Number.isInteger(canopy?.mesh));
  assert.ok(gltf.meshes[canopy.mesh].primitives.length >= 2);
});
