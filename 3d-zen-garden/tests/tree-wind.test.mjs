import test from 'node:test';
import assert from 'node:assert/strict';
import {installTreeWind} from '../dist/tree-wind.mjs';

function compile(material) {
  const shader = {uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>'};
  material.onBeforeCompile(shader);
  return shader;
}

test('wind passes across each tree crown and updates its shadow with one shared clock', () => {
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
