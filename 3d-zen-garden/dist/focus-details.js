import * as THREE from 'three';

const moss = new THREE.MeshStandardMaterial({color: 0x56764a, roughness: 1});
const darkMoss = new THREE.MeshStandardMaterial({color: 0x405e3d, roughness: 1});
const stone = new THREE.MeshStandardMaterial({color: 0x777f70, roughness: 1, flatShading: true});
const timber = new THREE.MeshStandardMaterial({color: 0x66533b, roughness: 1});
const palePetal = new THREE.MeshStandardMaterial({color: 0xe3dfc8, roughness: .9});

function plant(group, x, z, height, spread = .12, count = 6, seed = 0) {
  const positions = [];
  const colors = [];
  const palette = [0x3c6741, 0x527747, 0x6b8451, 0x476d51].map(value => new THREE.Color(value));
  for (let i = 0; i < count; i++) {
    const angle = i * Math.PI * (3 - Math.sqrt(5)) + seed;
    const dx = Math.cos(angle), dz = Math.sin(angle);
    const reach = spread * (.7 + (i % 3) * .18);
    const rise = height * (.75 + (i % 4) * .08);
    const baseX = x + dx * .014, baseZ = z + dz * .014;
    const tipX = baseX + dx * reach, tipZ = baseZ + dz * reach;
    const width = .018 + height * .085;
    const sideX = -dz * width, sideZ = dx * width;
    const vertices = [
      [baseX - sideX, .025, baseZ - sideZ],
      [baseX + dx * reach * .43, rise * .67, baseZ + dz * reach * .43],
      [tipX, .025 + rise * .22, tipZ],
      [baseX + sideX, .025, baseZ + sideZ],
      [tipX, .025 + rise * .22, tipZ],
      [baseX + dx * reach * .43, rise * .67, baseZ + dz * reach * .43],
    ];
    const color = palette[((i + seed) % palette.length + palette.length) % palette.length];
    for (const vertex of vertices) {
      positions.push(...vertex);
      colors.push(color.r, color.g, color.b);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  const leaves = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({vertexColors: true, side: THREE.DoubleSide, roughness: 1}));
  leaves.receiveShadow = true;
  group.add(leaves);
}

function mossStone(group, x, z, radius, height = .055) {
  const pebble = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), stone);
  pebble.position.set(x, height * .8, z);
  pebble.scale.set(radius, height, radius * .7);
  pebble.rotation.y = x * 1.7 + z;
  pebble.castShadow = true;
  group.add(pebble);
  const cap = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), darkMoss);
  cap.position.set(x - radius * .17, height * 1.6, z + radius * .08);
  cap.scale.set(radius * .63, height * .26, radius * .48);
  group.add(cap);
}

function cylinder(group, material, x, y, z, radius, height, sides = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, sides), material);
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  group.add(mesh);
  return mesh;
}

function ripple(group, x, z, radius) {
  const line = new THREE.Mesh(
    new THREE.RingGeometry(radius, radius + .008, 48),
    new THREE.MeshBasicMaterial({color: 0xc5d5b5, transparent: true, opacity: .42, side: THREE.DoubleSide, depthWrite: false}),
  );
  line.rotation.x = -Math.PI / 2;
  line.position.set(x, .078, z);
  group.add(line);
}

function lilyPad(group, x, z, radius, turn) {
  const outline = new THREE.Shape();
  outline.moveTo(0, 0);
  for (let i = 0; i <= 28; i++) {
    const angle = .18 + i / 28 * (Math.PI * 2 - .36);
    outline.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius * .84);
  }
  outline.closePath();
  const leaf = new THREE.Mesh(
    new THREE.ShapeGeometry(outline),
    new THREE.MeshStandardMaterial({color: 0x587c4b, roughness: .88, side: THREE.DoubleSide}),
  );
  leaf.rotation.set(-Math.PI / 2, 0, turn);
  leaf.position.set(x, .097, z);
  group.add(leaf);
  const veins = [];
  for (let i = 1; i <= 5; i++) {
    const angle = i * Math.PI * 2 / 6 + .15;
    veins.push(0, 0, 0, Math.cos(angle) * radius * .78, Math.sin(angle) * radius * .67, 0);
  }
  const lines = new THREE.BufferGeometry();
  lines.setAttribute('position', new THREE.Float32BufferAttribute(veins, 3));
  const veinsMesh = new THREE.LineSegments(lines, new THREE.LineBasicMaterial({color: 0x95a773, transparent: true, opacity: .55}));
  veinsMesh.rotation.copy(leaf.rotation);
  veinsMesh.position.set(x, .101, z);
  group.add(veinsMesh);
}

function reeds(group, x, z, count) {
  for (let i = 0; i < count; i++) {
    const angle = i * 2.399;
    const offset = .04 + i * .021;
    const height = .33 + (i % 3) * .075;
    const stem = cylinder(group, darkMoss, x + Math.cos(angle) * offset, .05 + height / 2, z + Math.sin(angle) * offset, .008, height, 5);
    stem.rotation.z = Math.sin(angle) * .14;
    stem.rotation.x = Math.cos(angle) * .12;
    cylinder(group, timber, stem.position.x, .09 + height, stem.position.z, .014, .085, 6);
  }
}

export function addFocusDetails(scene) {
  // 01: the rock island gains uneven moss, groundcover and weathered small stones.
  const projects = new THREE.Group(); projects.name = 'Focus01_RockIsland';
  for (const [x, z, size] of [[1.85,-2.17,.13],[2.22,-2.43,.15],[3.9,-2.12,.13],[3.27,-1.24,.16],[2.56,-1.28,.12]]) {
    plant(projects, x, z, size, size * 1.4, 7, Math.round(x * 10));
  }
  for (const [x,z,r] of [[1.92,-2.68,.16],[4.01,-1.84,.12],[2.14,-1.19,.13]]) mossStone(projects,x,z,r);
  scene.add(projects);

  // 02: a restrained ribbon of wild grass marks both sides of the journey path.
  const journey = new THREE.Group(); journey.name = 'Focus02_SteppingPath';
  for (const [x,z] of [[-2.35,-.65],[-1.66,-.32],[-1.15,.86],[-.43,-.04],[-.18,1.15],[.48,.26],[1.58,.88],[.8,1.95],[1.68,2.45],[.72,3.05],[-.46,3.61]]) {
    plant(journey,x,z,.12,.15,5,Math.round((x+z)*10));
  }
  scene.add(journey);

  // 03: fern clusters and the lichen-covered basin make the bamboo clearing feel lived-in.
  const bamboo = new THREE.Group(); bamboo.name = 'Focus03_BambooBasin';
  for (const [x,z,h] of [[-5.62,1.62,.25],[-5.48,3.58,.21],[-3.18,3.88,.26],[-2.56,1.56,.2],[-4.05,4.14,.18]]) plant(bamboo,x,z,h,.22,9,Math.round(-x*10));
  for (const [x,z] of [[-5.77,2.55],[-5.65,2.04],[-4.96,3.76]]) mossStone(bamboo,x,z,.15,.07);
  scene.add(bamboo);

  // 04: a small stone lantern and edge planting add scale to the open timber pavilion.
  const pavilion = new THREE.Group(); pavilion.name = 'Focus04_Pavilion';
  for (const [x,z] of [[-6.46,-3.47],[-6.36,-.46],[-1.85,-3.75],[-1.72,-.43]]) plant(pavilion,x,z,.18,.16,6,Math.round(-x*8));
  const lanternX = -1.55, lanternZ = -.22;
  cylinder(pavilion,stone,lanternX,.16,lanternZ,.15,.3);
  cylinder(pavilion,stone,lanternX,.37,lanternZ,.24,.08);
  cylinder(pavilion,timber,lanternX,.53,lanternZ,.12,.25,4);
  cylinder(pavilion,stone,lanternX,.69,lanternZ,.27,.08,4);
  const lanternGlow = new THREE.Mesh(new THREE.BoxGeometry(.13,.15,.13),new THREE.MeshBasicMaterial({color: 0xc9ad73}));
  lanternGlow.position.set(lanternX,.54,lanternZ); pavilion.add(lanternGlow);
  scene.add(pavilion);

  // 05: reeds, a quiet flower and fine water rings enrich the pond without hiding it.
  const pond = new THREE.Group(); pond.name = 'Focus05_Pond';
  for (const [x,z,h] of [[2.46,2.26,.32],[2.61,3.12,.28],[3.16,3.75,.26],[5.61,2.98,.32],[5.2,3.64,.25]]) plant(pond,x,z,h,.13,8,Math.round(z*9));
  reeds(pond,2.55,2.72,5);
  reeds(pond,5.38,3.25,4);
  for (const [x,z,r,turn] of [[4.48,2.15,.18,.2],[4.83,2.02,.145,.9],[5.01,2.37,.16,-.4],[4.3,2.83,.12,.5]]) lilyPad(pond,x,z,r,turn);
  for (const [x,z,r] of [[3.17,2.82,.075],[3.55,3.08,.06],[4.12,1.98,.055],[4.48,3.16,.07]]) {
    const submerged = new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),stone);
    submerged.position.set(x,.046,z);
    submerged.scale.set(r,.025,r*.75);
    pond.add(submerged);
  }
  const flowerX = 3.45, flowerZ = 2.32;
  for (let i = 0; i < 7; i++) {
    const angle = i * Math.PI * 2 / 7;
    const petal = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), palePetal);
    petal.position.set(flowerX + Math.cos(angle)*.11,.10,flowerZ + Math.sin(angle)*.11);
    petal.scale.set(.105,.037,.055);
    petal.rotation.y = -angle;
    pond.add(petal);
  }
  cylinder(pond,moss,flowerX,.112,flowerZ,.055,.035,10);
  ripple(pond,3.45,2.32,.32);
  ripple(pond,4.04,3.04,.23);
  ripple(pond,4.65,2.28,.34);
  scene.add(pond);
}
