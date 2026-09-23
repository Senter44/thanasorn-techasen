import * as THREE from 'three';

function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeSurface(kind) {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const context = canvas.getContext('2d');
  const image = context.createImageData(size, size);
  const pixels = image.data;
  const random = randomGenerator({sand: 17, stone: 29, wood: 41, roof: 53, moss: 67, soil: 79}[kind]);

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const grain = random() - .5;
      const broad = Math.sin(x * .115 + Math.sin(y * .028) * 2.3) * .5;
      const fine = Math.sin(x * .53 + Math.sin(y * .092) * 1.2) * .5;
      const mottling = Math.sin(x * .041 + y * .067) * Math.cos(y * .048 - x * .023);
      let shade;
      if (kind === 'wood' || kind === 'roof') shade = 225 + broad * 20 + fine * 9 + grain * 16;
      else if (kind === 'sand') shade = 238 + mottling * 4 + grain * 24;
      else if (kind === 'moss') shade = 226 + mottling * 13 + grain * 28;
      else if (kind === 'soil') shade = 228 + mottling * 10 + grain * 22;
      else shade = 228 + mottling * 9 + grain * 25;
      const index = (y * size + x) * 4;
      pixels[index] = shade;
      pixels[index + 1] = shade;
      pixels[index + 2] = shade;
      pixels[index + 3] = 255;
    }
  }
  context.putImageData(image, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

function surfaceKind(name) {
  if (/sand/i.test(name)) return 'sand';
  if (/cedar timber|cedar end grain|bark/i.test(name)) return 'wood';
  if (/cedar roof/i.test(name)) return 'roof';
  if (/moss|fern/i.test(name)) return 'moss';
  if (/earth/i.test(name)) return 'soil';
  if (/basalt|stepping stones/i.test(name)) return 'stone';
  return null;
}

function addPlanarUvs(geometry, kind) {
  const position = geometry.getAttribute('position');
  if (!position) return;
  const uvs = new Float32Array(position.count * 2);
  const grain = kind === 'wood' || kind === 'roof';
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    uvs[i * 2] = grain ? x * 1.8 + z * .3 : x * 1.5;
    uvs[i * 2 + 1] = grain ? y * 1.5 + z * 1.1 : z * 1.5;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

export function detailGardenSurfaces(root) {
  const textures = new Map();
  root.traverse(object => {
    if (!object.isMesh || !object.material) return;
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const kind = materials.map(material => surfaceKind(material.name)).find(Boolean);
    if (kind) addPlanarUvs(object.geometry, kind);
    const detailed = materials.map(material => {
      const type = surfaceKind(material.name);
      if (!type && !/foliage/i.test(material.name)) return material;
      const copy = material.clone();
      if (type) {
        if (!textures.has(type)) textures.set(type, makeSurface(type));
        copy.map = textures.get(type);
        copy.bumpMap = textures.get(type);
        copy.bumpScale = type === 'sand' ? .016 : type === 'wood' || type === 'roof' ? .022 : .035;
        copy.roughness = type === 'sand' || type === 'moss' ? 1 : .92;
        if (type === 'sand') copy.color.multiplyScalar(.84);
        if (type === 'moss') copy.color.lerp(new THREE.Color(0x4e7745), .28);
        copy.needsUpdate = true;
      } else if (/foliage/i.test(material.name)) {
        copy.color.lerp(new THREE.Color(0x567c4c), .24).multiplyScalar(.87);
        copy.roughness = .9;
      }
      return copy;
    });
    object.material = Array.isArray(object.material) ? detailed : detailed[0];
  });
}

function openSand(x, z) {
  const inside = Math.abs(x) < 7.35 && Math.abs(z) < 4.4;
  const projects = ((x - 3) / 2.3) ** 2 + ((z + 2) / 1.75) ** 2 < 1;
  const pond = ((x - 4) / 2.05) ** 2 + ((z - 2.5) / 1.65) ** 2 < 1;
  const pavilion = x > -6.5 && x < -1.5 && z > -3.85 && z < -.1;
  const bamboo = x > -5.7 && x < -2.25 && z > 1.05 && z < 4.25;
  return inside && !projects && !pond && !pavilion && !bamboo;
}

export function addGroundDetails(scene) {
  const random = randomGenerator(2073);
  const dummy = new THREE.Object3D();
  const pebbles = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({roughness: 1, flatShading: true}),
    220,
  );
  const pebbleColors = [0xa09a86, 0xb2aa91, 0x908f7d, 0xc1bba4];
  let count = 0;
  for (let attempts = 0; count < 220 && attempts < 1500; attempts++) {
    const x = (random() - .5) * 14.7;
    const z = (random() - .5) * 8.8;
    if (!openSand(x, z)) continue;
    const radius = .018 + random() ** 2 * .045;
    dummy.position.set(x, .012 + radius * .25, z);
    dummy.rotation.set(random() * .35, random() * Math.PI * 2, random() * .35);
    dummy.scale.set(radius * (1.2 + random()), radius * .45, radius * (1 + random()));
    dummy.updateMatrix();
    pebbles.setMatrixAt(count, dummy.matrix);
    pebbles.setColorAt(count, new THREE.Color(pebbleColors[Math.floor(random() * pebbleColors.length)]));
    count++;
  }
  pebbles.count = count;
  pebbles.instanceMatrix.needsUpdate = true;
  if (pebbles.instanceColor) pebbles.instanceColor.needsUpdate = true;
  scene.add(pebbles);

  const leafShape = new THREE.BufferGeometry();
  leafShape.setAttribute('position', new THREE.Float32BufferAttribute([
    0, 0, -.5, -.19, .018, 0, 0, .034, .5,
    0, 0, -.5, 0, .034, .5, .19, .018, 0,
  ], 3));
  leafShape.computeVertexNormals();
  const leaves = new THREE.InstancedMesh(
    leafShape,
    new THREE.MeshStandardMaterial({roughness: 1, side: THREE.DoubleSide}),
    90,
  );
  const leafColors = [0x8b794a, 0x6b7844, 0x967e52, 0x68764b];
  count = 0;
  for (let attempts = 0; count < 90 && attempts < 700; attempts++) {
    const x = (random() - .5) * 15;
    const z = (random() - .5) * 9;
    if (!openSand(x, z) || Math.abs(x) < 5.3 && Math.abs(z) < 2.8) continue;
    const scale = .13 + random() * .12;
    dummy.position.set(x, .022, z);
    dummy.rotation.set(0, random() * Math.PI * 2, 0);
    dummy.scale.setScalar(scale);
    dummy.updateMatrix();
    leaves.setMatrixAt(count, dummy.matrix);
    leaves.setColorAt(count, new THREE.Color(leafColors[Math.floor(random() * leafColors.length)]));
    count++;
  }
  leaves.count = count;
  leaves.instanceMatrix.needsUpdate = true;
  if (leaves.instanceColor) leaves.instanceColor.needsUpdate = true;
  scene.add(leaves);
}
