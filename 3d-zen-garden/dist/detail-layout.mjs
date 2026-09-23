const roofProfile = [
  [-4.08, 2.91], [-3.77, 2.86], [-3.43, 2.91], [-3.10, 3.04],
  [-2.75, 3.23], [-2.38, 3.44], [-2.0, 3.63], [-1.62, 3.44],
  [-1.25, 3.23], [-.90, 3.04], [-.57, 2.91], [-.23, 2.86], [.08, 2.91],
];

export function roofSurfaceAt(z) {
  if (z <= roofProfile[0][0]) return roofProfile[0][1];
  for (let i = 1; i < roofProfile.length; i++) {
    const [endZ, endY] = roofProfile[i];
    if (z <= endZ) {
      const [startZ, startY] = roofProfile[i - 1];
      return startY + (endY - startY) * (z - startZ) / (endZ - startZ);
    }
  }
  return roofProfile.at(-1)[1];
}

export function roofTilePlan() {
  const tiles = [];
  for (let column = 0; column < 30; column++) {
    for (let row = 0; row < 12; row++) {
      const x = -6.37 + column * .159;
      const z = -3.88 + row * .338;
      const slope = (roofSurfaceAt(z + .08) - roofSurfaceAt(z - .08)) / .16;
      tiles.push({x, y: roofSurfaceAt(z) + .07, z, tilt: -Math.atan(slope), shade: (column * 7 + row * 3) % 7});
    }
  }
  return tiles;
}

export function scatterEllipse({seed, count, x, z, radiusX, radiusZ, inner = 0}) {
  if (!Number.isInteger(count) || count < 0 || !Number.isFinite(radiusX) || !Number.isFinite(radiusZ) || radiusX <= 0 || radiusZ <= 0 || inner < 0 || inner >= 1) {
    throw new RangeError('Invalid scatter dimensions');
  }
  let value = seed >>> 0;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const points = [];
  for (let i = 0; i < count; i++) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(inner * inner + random() * (1 - inner * inner));
    points.push({x: x + Math.cos(angle) * radiusX * distance, z: z + Math.sin(angle) * radiusZ * distance, variation: random()});
  }
  return points;
}

export function gardenGroundcoverPlan() {
  const journeyStones = [[-2.30,-.12],[-1.48,.22],[-.68,.52],[.20,.72],[.95,1.16],[1.35,1.92],[1.20,2.77],[.63,3.53],[-.14,4.03]];
  return {
    projects: scatterEllipse({seed: 101, count: 60, x: 3, z: -2, radiusX: 1.85, radiusZ: 1.25, inner: .69}),
    experience: journeyStones.flatMap(([x,z], index) => scatterEllipse({seed: 303 + index * 17, count: 5, x, z, radiusX: .63, radiusZ: .3, inner: .8})),
    about: scatterEllipse({seed: 509, count: 48, x: -4, z: 2.6, radiusX: 1.9, radiusZ: 1.55, inner: .68}),
    toolkit: scatterEllipse({seed: 709, count: 56, x: -4, z: -2, radiusX: 2.6, radiusZ: 1.85, inner: .84}),
    contact: scatterEllipse({seed: 907, count: 55, x: 4, z: 2.5, radiusX: 2.1, radiusZ: 1.45, inner: .82}),
  };
}
