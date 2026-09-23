import * as THREE from 'three';

const assets = './assets/materials/';

function finishTexture(texture, isColor) {
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 8;
  if (isColor) texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export async function applyPhotographicStone(root) {
  const loader = new THREE.TextureLoader();
  const [neutralColor, neutralNormal, mossyColor, mossyNormal] = await Promise.all([
    loader.loadAsync(`${assets}rock_01_diff_1k.jpg`),
    loader.loadAsync(`${assets}rock_01_nor_gl_1k.jpg`),
    loader.loadAsync(`${assets}mossy_rock_diff_1k.jpg`),
    loader.loadAsync(`${assets}mossy_rock_nor_gl_1k.jpg`),
  ]);
  const neutral = {color: finishTexture(neutralColor, true), normal: finishTexture(neutralNormal, false)};
  const mossy = {color: finishTexture(mossyColor, true), normal: finishTexture(mossyNormal, false)};
  root.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const darkRock = /ProjectsStandingStone|ProjectsMossCap/.test(object.name);
    const paleRock = /JourneySteppingStone|PondEdgeStone|PondMossEdge/.test(object.name);
    if (!darkRock && !paleRock) return;
    const texture = darkRock ? mossy : neutral;
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      material.color.set(darkRock ? 0xdbe2d2 : 0xe6e8df);
      material.map = texture.color;
      material.normalMap = texture.normal;
      material.normalScale = new THREE.Vector2(.55, .55);
      material.bumpMap = null;
      material.roughness = .96;
      material.needsUpdate = true;
    }
  });
}
