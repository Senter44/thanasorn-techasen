import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {installTreeWind, WIND_GUST_STRENGTH} from '../dist/tree-wind.mjs';

function compile(material) {
  const shader = {uniforms: {}, vertexShader: '#include <common>\n#include <begin_vertex>'};
  material.onBeforeCompile(shader);
  return shader;
}

test('wind bends the trunk and crown together while their shadows share one clock', () => {
  assert.ok(WIND_GUST_STRENGTH >= .28, 'tree motion must remain visible from the default camera');
  const materials = [{name: 'Japanese foliage 00'}, {name: 'Japanese foliage 01'}];
  const canopy = {isMesh: true, material: materials};
  const trunkMaterial = {name: 'bark'};
  const trunk = {isMesh: true, material: trunkMaterial};
  const depthMaterials = [];
  const wind = installTreeWind([canopy, trunk], () => {
    const depthMaterial = {};
    depthMaterials.push(depthMaterial);
    return depthMaterial;
  });

  assert.equal(canopy.customDepthMaterial, depthMaterials[0]);
  assert.equal(trunk.customDepthMaterial, depthMaterials[1]);
  for (const material of [...materials, trunkMaterial, ...depthMaterials]) {
    const shader = compile(material);
    assert.match(shader.vertexShader, /uniform float treeWindTime/);
    assert.match(shader.vertexShader, /modelMatrix \* vec4\(position, 1\.0\)/);
    assert.match(shader.vertexShader, /smoothstep\(0\.35, 2\.5, treeWorldPosition\.y\)/);
    assert.match(shader.vertexShader, /dot\(treeBasis\[0\], worldBend\)/);
    assert.strictEqual(shader.uniforms.treeWindTime, wind.uniform);
  }
  wind.setTime(2.5);
  assert.equal(wind.uniform.value, 2.5);
});

test('missing tree meshes leave the garden unchanged', () => {
  assert.equal(installTreeWind(null, () => ({})), null);
  assert.equal(installTreeWind([{isMesh: false}], () => ({})), null);
});

test('shipped garden model contains both crown and bark meshes that receive wind', () => {
  const model = readFileSync(new URL('../dist/assets/garden.glb', import.meta.url));
  const jsonLength = model.readUInt32LE(12);
  const gltf = JSON.parse(model.subarray(20, 20 + jsonLength).toString());
  const canopy = gltf.nodes.find(node => node.name === 'Perimeter_Japanese_foliage_00');
  const trunk = gltf.nodes.find(node => node.name === 'Perimeter_Weathered_silver_brown_bark');
  assert.ok(Number.isInteger(canopy?.mesh));
  assert.ok(Number.isInteger(trunk?.mesh));
  assert.ok(gltf.meshes[canopy.mesh].primitives.length >= 2);
});
