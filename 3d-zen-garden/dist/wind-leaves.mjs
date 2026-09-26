export const WIND_LEAF_COUNT = 18;

const groves = [
  {x: -6.7, y: 2.6, z: -3.7},
  {x: -3.4, y: 3.0, z: -4.0},
  {x: 0.1, y: 2.7, z: -3.8},
  {x: 3.3, y: 2.8, z: -3.5},
  {x: 5.4, y: 2.3, z: -1.2},
  {x: -5.0, y: 2.2, z: 0.6},
];

export function windLeafPose(index, time) {
  const grove = groves[index % groves.length];
  const cycle = ((time % 5) + 5) % 5;
  const progress = (cycle / 5 + Math.floor(index / groves.length) * 0.23) % 1;
  return {
    x: grove.x - 0.35 + progress * 2.2,
    y: grove.y + Math.sin(cycle * 1.2 + index * 1.7) * 0.16 - progress * 0.35,
    z: grove.z + Math.sin(cycle * 0.9 + index * 0.7) * 0.22,
    angle: cycle * 1.4 + index * 1.9,
  };
}
