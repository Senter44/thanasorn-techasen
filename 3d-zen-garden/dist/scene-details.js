import * as THREE from 'three';
import {sampleSurface, rockRelief} from './surface-pattern.mjs';

function randomGenerator(seed) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

function makeSurface(kind) {
  const size = 256;
  const colorCanvas = document.createElement('canvas');
  const bumpCanvas = document.createElement('canvas');
  colorCanvas.width = colorCanvas.height = size;
  bumpCanvas.width = bumpCanvas.height = size;
  const colorContext = colorCanvas.getContext('2d');
  const bumpContext = bumpCanvas.getContext('2d');
  const colorImage = colorContext.createImageData(size, size);
  const bumpImage = bumpContext.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const {r, g, b, bump} = sampleSurface(kind, x, y);
      const index = (y * size + x) * 4;
      colorImage.data.set([r, g, b, 255], index);
      bumpImage.data.set([bump, bump, bump, 255], index);
    }
  }
  colorContext.putImageData(colorImage, 0, 0);
  bumpContext.putImageData(bumpImage, 0, 0);
  const color = new THREE.CanvasTexture(colorCanvas);
  const relief = new THREE.CanvasTexture(bumpCanvas);
  color.colorSpace = THREE.SRGBColorSpace;
  for (const texture of [color, relief]) {
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.anisotropy = 4;
  }
  return {color, relief};
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
  if (kind === 'water' || kind === 'stone') geometry.computeBoundingBox();
  const bounds = geometry.boundingBox;
  const uprightStone = kind === 'stone' && bounds.max.y - bounds.min.y > Math.max(bounds.max.x - bounds.min.x, bounds.max.z - bounds.min.z) * .8;
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    uvs[i * 2] = kind === 'water' ? (x - bounds.min.x) / (bounds.max.x - bounds.min.x || 1) : grain ? x * 1.8 + z * .3 : uprightStone ? x * 1.7 + z * .85 : x * 1.5;
    uvs[i * 2 + 1] = kind === 'water' ? (z - bounds.min.z) / (bounds.max.z - bounds.min.z || 1) : grain ? y * 1.5 + z * 1.1 : uprightStone ? y * 2.2 + z * .55 : z * 1.5;
  }
  geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
}

function subdivideRock(source, levels) {
  const sourcePosition = source.getAttribute('position');
  const vertices = [];
  for (let i = 0; i < sourcePosition.count; i++) vertices.push(sourcePosition.getX(i), sourcePosition.getY(i), sourcePosition.getZ(i));
  let indices = source.index ? [...source.index.array] : Array.from({length: sourcePosition.count}, (_, i) => i);
  for (let level = 0; level < levels; level++) {
    const edges = new Map();
    const midpoint = (a, b) => {
      const key = a < b ? `${a}:${b}` : `${b}:${a}`;
      if (edges.has(key)) return edges.get(key);
      const next = vertices.length / 3;
      for (let axis = 0; axis < 3; axis++) vertices.push((vertices[a * 3 + axis] + vertices[b * 3 + axis]) / 2);
      edges.set(key, next);
      return next;
    };
    const divided = [];
    for (let i = 0; i < indices.length; i += 3) {
      const a = indices[i], b = indices[i + 1], c = indices[i + 2];
      const ab = midpoint(a, b), bc = midpoint(b, c), ca = midpoint(c, a);
      divided.push(a, ab, ca, ab, b, bc, ca, bc, c, ab, bc, ca);
    }
    indices = divided;
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function weatherRock(object) {
  const source = object.geometry;
  if (!source.getAttribute('position')) return;
  const levels = /ProjectsStandingStone|JourneySteppingStone/.test(object.name) ? 2 : 1;
  const geometry = subdivideRock(source, levels);
  const position = geometry.getAttribute('position');
  geometry.computeBoundingBox();
  const normal = geometry.getAttribute('normal');
  const center = new THREE.Vector3();
  const extent = new THREE.Vector3();
  geometry.boundingBox.getCenter(center);
  geometry.boundingBox.getSize(extent);
  const amplitude = Math.min(.11, Math.max(extent.x, extent.y, extent.z) * .065);
  const seed = [...object.name].reduce((value, letter) => value + letter.charCodeAt(0), 0);
  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i), y = position.getY(i), z = position.getZ(i);
    const displacement = rockRelief(x - center.x, y - center.y, z - center.z, seed) * amplitude;
    position.setXYZ(i, x + normal.getX(i) * displacement, y + normal.getY(i) * displacement, z + normal.getZ(i) * displacement);
  }
  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  object.geometry = geometry;
}

export function detailGardenSurfaces(root) {
  const textures = new Map();
  root.traverse(object => {
    if (!object.isMesh || !object.material) return;
    if (/ProjectsStandingStone|ProjectsMossCap|JourneySteppingStone|PondEdgeStone|PondMossEdge/.test(object.name)) weatherRock(object);
    const materials = Array.isArray(object.material) ? object.material : [object.material];
    const kind = materials.map(material => surfaceKind(material.name)).find(Boolean);
    if (kind) addPlanarUvs(object.geometry, kind);
    const detailed = materials.map(material => {
      const type = surfaceKind(material.name);
      if (!type && !/foliage/i.test(material.name)) return material;
      const copy = material.clone();
      if (type) {
        if (!textures.has(type)) textures.set(type, makeSurface(type));
        copy.map = textures.get(type).color;
        copy.bumpMap = textures.get(type).relief;
        copy.bumpScale = type === 'sand' ? .012 : type === 'wood' || type === 'roof' ? .025 : type === 'stone' ? .055 : .035;
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

export function detailPondWater(pond) {
  addPlanarUvs(pond.geometry, 'water');
  const {color, relief} = makeSurface('water');
  pond.material.map = color;
  pond.material.bumpMap = relief;
  pond.material.bumpScale = .016;
  pond.material.needsUpdate = true;
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
