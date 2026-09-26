export const WIND_GUST_STRENGTH = 0.58;

const windVertex = `#include <begin_vertex>
  float crown = smoothstep(1.2, 2.7, position.y);
  float gust = max(0.0, sin(treeWindTime * 0.9 - position.x * 0.55 + position.z * 0.18));
  gust *= gust * gust;
  float sway = sin(treeWindTime * 1.25 - position.x * 0.45 + position.z * 0.3);
  transformed.x += crown * (0.11 * sway + ${WIND_GUST_STRENGTH} * gust);
  transformed.z += crown * 0.09 * sin(treeWindTime * 1.05 - position.x * 0.52);`;

function addWindToMaterial(material, uniform) {
  const original = material.onBeforeCompile;
  material.onBeforeCompile = function (shader, renderer) {
    original?.call(this, shader, renderer);
    shader.uniforms.treeWindTime = uniform;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float treeWindTime;')
      .replace('#include <begin_vertex>', windVertex);
  };
  material.needsUpdate = true;
}

export function installTreeWind(canopy, depthMaterial) {
  if (!canopy?.isMesh) return null;
  const uniform = {value: 0};
  for (const material of Array.isArray(canopy.material) ? canopy.material : [canopy.material]) {
    addWindToMaterial(material, uniform);
  }
  if (depthMaterial) {
    addWindToMaterial(depthMaterial, uniform);
    canopy.customDepthMaterial = depthMaterial;
  }
  return {uniform, setTime(seconds) { uniform.value = seconds; }};
}
