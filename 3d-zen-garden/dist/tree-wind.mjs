export const WIND_GUST_STRENGTH = 0.58;

const windVertex = `#include <begin_vertex>
  vec3 treeWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;
  float crown = smoothstep(0.35, 2.5, treeWorldPosition.y);
  float gust = max(0.0, sin(treeWindTime * 0.9 - treeWorldPosition.x * 0.55 + treeWorldPosition.z * 0.18));
  gust *= gust * gust;
  float sway = sin(treeWindTime * 1.25 - treeWorldPosition.x * 0.45 + treeWorldPosition.z * 0.3);
  vec3 worldBend = crown * vec3(
    0.11 * sway + ${WIND_GUST_STRENGTH} * gust,
    0.0,
    0.09 * sin(treeWindTime * 1.05 - treeWorldPosition.x * 0.52)
  );
  mat3 treeBasis = mat3(modelMatrix);
  transformed += vec3(
    dot(treeBasis[0], worldBend),
    dot(treeBasis[1], worldBend),
    dot(treeBasis[2], worldBend)
  );`;

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

export function installTreeWind(nodes, makeDepthMaterial) {
  const treeMeshes = new Set();
  for (const node of Array.isArray(nodes) ? nodes : []) {
    if (node?.traverse) node.traverse(child => { if (child.isMesh) treeMeshes.add(child); });
    else if (node?.isMesh) treeMeshes.add(node);
  }
  if (!treeMeshes.size) return null;
  const uniform = {value: 0};
  for (const mesh of treeMeshes) {
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      addWindToMaterial(material, uniform);
    }
    const depthMaterial = makeDepthMaterial?.(mesh);
    if (depthMaterial) {
      addWindToMaterial(depthMaterial, uniform);
      mesh.customDepthMaterial = depthMaterial;
    }
  }
  return {uniform, setTime(seconds) { uniform.value = seconds; }};
}
