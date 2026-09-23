import * as THREE from 'three';
import {bridgePlankPlan, gardenGroundcoverPlan, gardenMeadowPlan, roofTilePlan, scatterEllipse} from './detail-layout.mjs?v=2';

const leafColors = [0x52754b, 0x618257, 0x789366, 0x667b50, 0x597963].map(color => new THREE.Color(color));
const slateColors = [0x52695d, 0x5d715f, 0x6b7865, 0x4b635b, 0x76816b, 0x586d64, 0x657766].map(color => new THREE.Color(color));
const wood = new THREE.MeshStandardMaterial({color: 0x654d35, roughness: .88});
const darkWood = new THREE.MeshStandardMaterial({color: 0x3d3229, roughness: .9});
const brass = new THREE.MeshStandardMaterial({color: 0x9d8758, metalness: .45, roughness: .48});
const amber = new THREE.MeshStandardMaterial({color: 0xf0c887, emissive: 0x664022, emissiveIntensity: .45, roughness: .6});

function box(group, name, x, y, z, width, height, depth, material) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  return mesh;
}

function cylinder(group, name, x, y, z, radiusTop, radiusBottom, height, material, sides = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radiusTop, radiusBottom, height, sides), material);
  mesh.name = name;
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function addRoof(scene) {
  const group = new THREE.Group(); group.name = 'DetailedPavilionRoof';
  const plan = roofTilePlan();
  const tile = new THREE.InstancedMesh(
    new THREE.BoxGeometry(.148, .028, .345),
    new THREE.MeshStandardMaterial({color: 0xffffff, roughness: .88, metalness: .03}),
    plan.length,
  );
  tile.name = 'IndividualCeramicRoofTiles';
  tile.castShadow = true;
  tile.receiveShadow = true;
  const dummy = new THREE.Object3D();
  plan.forEach(({x, y, z, tilt, shade}, index) => {
    dummy.position.set(x, y, z);
    dummy.rotation.set(tilt, 0, 0);
    dummy.scale.set(1, 1, .99 + (index % 3) * .013);
    dummy.updateMatrix();
    tile.setMatrixAt(index, dummy.matrix);
    tile.setColorAt(index, slateColors[shade]);
  });
  tile.instanceMatrix.needsUpdate = true;
  if (tile.instanceColor) tile.instanceColor.needsUpdate = true;
  group.add(tile);

  // Clay ridge caps and weathered fascia make the roof read as construction, not a flat plane.
  const ridgeMaterial = new THREE.MeshStandardMaterial({color: 0x40594e, roughness: .84});
  for (let i = 0; i < 29; i++) {
    cylinder(group, 'RoofRidgeCap', -6.34 + i * .16, 3.725, -2, .083, .083, .155, ridgeMaterial, 10).rotation.z = Math.PI / 2;
  }
  box(group, 'FrontEaveBeam', -4, 2.83, .02, 5.05, .085, .09, darkWood);
  box(group, 'RearEaveBeam', -4, 2.83, -4.02, 5.05, .085, .09, darkWood);
  scene.add(group);
}

function lantern(group, x, z) {
  const y = 2.15;
  cylinder(group, 'LanternCord', x, 2.53, z, .012, .012, .46, darkWood, 6);
  box(group, 'LanternTop', x, y + .21, z, .29, .045, .29, darkWood);
  box(group, 'LanternBottom', x, y - .21, z, .29, .045, .29, darkWood);
  box(group, 'LanternWarmPaper', x, y, z, .205, .35, .205, amber);
  for (const dx of [-.12, .12]) for (const dz of [-.12, .12]) box(group, 'LanternFrame', x + dx, y, z + dz, .025, .39, .025, darkWood);
}

function addPavilionJoinery(scene) {
  const group = new THREE.Group(); group.name = 'DetailedPavilionJoinery';
  for (let i = 0; i < 18; i++) {
    const x = -5.58 + i * .185;
    box(group, 'CedarLatticeSlat', x, 1.48, -3.13, .045, 1.72, .045, wood);
  }
  for (const y of [.71, 1.48, 2.25]) box(group, 'CedarLatticeRail', -4.01, y, -3.13, 3.35, .065, .07, darkWood);
  lantern(group, -5.26, -.93);
  lantern(group, -2.74, -.93);
  cylinder(group, 'TeaCup', -3.63, .365, -2.67, .115, .09, .09,
    new THREE.MeshStandardMaterial({color: 0xa8aa91, roughness: .67}), 12);
  cylinder(group, 'TeaPot', -4.1, .385, -2.67, .16, .14, .13,
    new THREE.MeshStandardMaterial({color: 0x6d7768, roughness: .67}), 12);
  cylinder(group, 'TeaPotLid', -4.1, .465, -2.67, .09, .09, .028, brass, 12);
  scene.add(group);
}

function tuftGeometry() {
  const positions = [];
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const rise = .09 + (i % 3) * .022;
    const reach = .075 + (i % 4) * .012;
    const sideX = -dz * .009, sideZ = dx * .009;
    positions.push(-sideX, 0, -sideZ, dx * reach * .45, rise, dz * reach * .45, dx * reach, rise * .24, dz * reach);
    positions.push(sideX, 0, sideZ, dx * reach, rise * .24, dz * reach, dx * reach * .45, rise, dz * reach * .45);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function addMeadowPatches(scene) {
  const group = new THREE.Group(); group.name = 'GardenGreenSpaces';
  const material = new THREE.MeshStandardMaterial({vertexColors: true, roughness: 1, side: THREE.DoubleSide});
  const shades = [0x628a56, 0x71935d, 0x5d8150, 0x789b66];
  gardenMeadowPlan().forEach(({x, z, radiusX, radiusZ, seed}, patchIndex) => {
    const segments = 28;
    const positions = [x, .032, z];
    const colors = [...new THREE.Color(shades[patchIndex % shades.length]).toArray()];
    const indices = [];
    for (let ring = 1; ring <= 2; ring++) {
      for (let i = 0; i < segments; i++) {
        const angle = i * Math.PI * 2 / segments;
        const waviness = .91 + .055 * Math.sin(angle * 5 + seed) + .035 * Math.sin(angle * 9 - seed);
        const reach = waviness * ring / 2;
        positions.push(x + Math.cos(angle) * radiusX * reach, ring === 1 ? .027 : .011, z + Math.sin(angle) * radiusZ * reach);
        const color = new THREE.Color(shades[(patchIndex + i % 4) % shades.length]);
        if (ring === 2) color.lerp(new THREE.Color(0x9ba66c), .24);
        colors.push(...color.toArray());
        if (ring === 1) indices.push(0, 1 + (i + 1) % segments, 1 + i);
        else {
          const inner = 1 + i, nextInner = 1 + (i + 1) % segments;
          const outer = 1 + segments + i, nextOuter = 1 + segments + (i + 1) % segments;
          indices.push(inner, nextInner, outer, nextInner, nextOuter, outer);
        }
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    const patch = new THREE.Mesh(geometry, material);
    patch.name = 'MossAndGrassMeadow';
    patch.receiveShadow = true;
    group.add(patch);
  });
  scene.add(group);
}

function addGroundcover(scene) {
  const plan = gardenGroundcoverPlan();
  const points = [
    ...Object.values(plan).flat(),
    ...gardenMeadowPlan().flatMap(({seed, x, z, radiusX, radiusZ}) =>
      scatterEllipse({seed, count: 34, x, z, radiusX: radiusX * .83, radiusZ: radiusZ * .83})),
  ];
  const group = new THREE.Group(); group.name = 'DetailedGardenGroundcover';
  const tufts = new THREE.InstancedMesh(
    tuftGeometry(),
    new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 1, side: THREE.DoubleSide}),
    points.length,
  );
  tufts.name = 'IndividualGrassAndFernTufts';
  tufts.receiveShadow = true;
  const dummy = new THREE.Object3D();
  points.forEach(({x, z, variation}, index) => {
    const scale = .7 + variation * .8;
    dummy.position.set(x, .018, z);
    dummy.rotation.set(0, variation * Math.PI * 2, 0);
    dummy.scale.set(scale, scale * (.8 + variation * .55), scale);
    dummy.updateMatrix();
    tufts.setMatrixAt(index, dummy.matrix);
    tufts.setColorAt(index, leafColors[(index * 3 + Math.floor(variation * 5)) % leafColors.length]);
  });
  tufts.instanceMatrix.needsUpdate = true;
  if (tufts.instanceColor) tufts.instanceColor.needsUpdate = true;
  group.add(tufts);
  scene.add(group);
}

function bambooLeaf(group, x, y, z, angle, length, material) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute([
    0,0,0, length*.42,length*.1,-.065, length,.03,0,
    0,0,0, length,.03,0, length*.42,length*.1,.065,
  ], 3));
  geometry.computeVertexNormals();
  const leaf = new THREE.Mesh(geometry, material);
  leaf.name = 'BambooLeaf';
  leaf.position.set(x, y, z);
  leaf.rotation.y = angle;
  leaf.castShadow = true;
  group.add(leaf);
}

function addBambooThicket(scene) {
  const group = new THREE.Group(); group.name = 'DetailedBambooThicket';
  const culm = new THREE.MeshStandardMaterial({color: 0x6d854b, roughness: .78});
  const node = new THREE.MeshStandardMaterial({color: 0x486538, roughness: .85});
  const foliage = new THREE.MeshStandardMaterial({color: 0x648953, side: THREE.DoubleSide, roughness: .9});
  const stalks = [[-3.07,2.06,2.65],[-2.82,2.72,2.9],[-3.18,3.48,2.42],[-5.11,3.74,2.55],[-5.35,1.76,2.36]];
  stalks.forEach(([x,z,height], index) => {
    const radius = .035 + (index % 3) * .006;
    cylinder(group, 'SegmentedBambooCulm', x, height / 2 + .04, z, radius * .78, radius, height, culm);
    for (let i = 1; i <= 5; i++) {
      const y = .04 + height * i / 6;
      cylinder(group, 'BambooNodeRing', x, y, z, radius * 1.15, radius * 1.15, .026, node);
    }
    for (let level = 0; level < 3; level++) {
      const y = height * (.55 + level * .17);
      for (let leaf = 0; leaf < 5; leaf++) bambooLeaf(group, x, y, z, index * .7 + leaf * 1.26, .24 + .055 * (leaf % 3), foliage);
    }
  });
  scene.add(group);
}

function addPathGravel(scene) {
  const path = [[-2.30,-.12],[-1.48,.22],[-.68,.52],[.20,.72],[.95,1.16],[1.35,1.92],[1.20,2.77],[.63,3.53],[-.14,4.03]];
  const group = new THREE.Group(); group.name = 'DetailedJourneyPath';
  const points = path.flatMap(([x,z], index) => scatterEllipse({seed: 119 + index * 29, count: 13, x, z, radiusX: .73, radiusZ: .52, inner: .76}));
  const gravel = new THREE.InstancedMesh(
    new THREE.IcosahedronGeometry(1, 0),
    new THREE.MeshStandardMaterial({color: 0xffffff, roughness: 1, flatShading: true}),
    points.length,
  );
  gravel.name = 'PathEdgeGravel';
  const colors = [0x8e9581, 0xadb09a, 0x7c8777, 0xa3a58f].map(color => new THREE.Color(color));
  const dummy = new THREE.Object3D();
  points.forEach(({x,z,variation}, index) => {
    const size = .025 + variation * .035;
    dummy.position.set(x, .016, z);
    dummy.rotation.y = variation * Math.PI;
    dummy.scale.set(size * 1.4, size * .33, size);
    dummy.updateMatrix();
    gravel.setMatrixAt(index, dummy.matrix);
    gravel.setColorAt(index, colors[index % colors.length]);
  });
  gravel.instanceMatrix.needsUpdate = true;
  if (gravel.instanceColor) gravel.instanceColor.needsUpdate = true;
  group.add(gravel);
  scene.add(group);
}

function rodBetween(group, name, start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, direction.length(), 7), material);
  rod.name = name;
  rod.position.copy(start).add(end).multiplyScalar(.5);
  rod.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.normalize());
  rod.castShadow = true;
  group.add(rod);
}

function addPondBridge(scene) {
  const group = new THREE.Group(); group.name = 'DetailedPondBridge';
  const planks = bridgePlankPlan();
  const deckWood = new THREE.MeshStandardMaterial({color: 0x736046, roughness: .96});
  const edgeWood = new THREE.MeshStandardMaterial({color: 0x4c4435, roughness: .94});
  planks.forEach(({x, y, z}, index) => {
    const plank = box(group, 'WeatheredBridgePlank', x, y, z, .182, .052, .59, deckWood);
    plank.rotation.z = index === 0 || index === 10 ? 0 : (planks[index + 1]?.y - planks[index - 1]?.y || 0) * -.23;
  });
  for (const side of [-1, 1]) {
    const z = 3.03 + side * .265;
    for (let index = 0; index < 10; index++) {
      const a = planks[index], b = planks[index + 1];
      rodBetween(group, 'CurvedBridgeStringer', new THREE.Vector3(a.x, a.y - .095, z), new THREE.Vector3(b.x, b.y - .095, z), .032, edgeWood);
      rodBetween(group, 'LowBridgeRail', new THREE.Vector3(a.x, a.y + .31, z), new THREE.Vector3(b.x, b.y + .31, z), .022, edgeWood);
    }
    for (const index of [0, 5, 10]) {
      const {x, y} = planks[index];
      cylinder(group, 'BridgeRailPost', x, y + .15, z, .032, .039, .35, edgeWood);
      cylinder(group, 'BridgePostCap', x, y + .34, z, .05, .05, .035, brass);
    }
  }
  scene.add(group);
}

export function addDetailedDiorama(scene) {
  addRoof(scene);
  addPavilionJoinery(scene);
  addMeadowPatches(scene);
  addGroundcover(scene);
  addBambooThicket(scene);
  addPathGravel(scene);
  addPondBridge(scene);
}
