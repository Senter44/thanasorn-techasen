const clampByte = value => Math.max(0, Math.min(255, Math.round(value)));
const fade = value => value * value * (3 - 2 * value);

function hash(x, y, z = 0) {
  let value = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2246822519);
  value = Math.imul(value ^ value >>> 13, 1274126177);
  return ((value ^ value >>> 16) >>> 0) / 4294967295;
}

function noise2(x, y, seed) {
  const ix = Math.floor(x), iy = Math.floor(y);
  const fx = fade(x - ix), fy = fade(y - iy);
  const a = hash(ix, iy, seed) * (1 - fx) + hash(ix + 1, iy, seed) * fx;
  const b = hash(ix, iy + 1, seed) * (1 - fx) + hash(ix + 1, iy + 1, seed) * fx;
  return a * (1 - fy) + b * fy;
}

function noise3(x, y, z, seed) {
  const ix = Math.floor(x), iy = Math.floor(y), iz = Math.floor(z);
  const fx = fade(x - ix), fy = fade(y - iy), fz = fade(z - iz);
  const corner = (dx, dy, dz) => hash(ix + dx, iy + dy, iz + dz + seed);
  const layer = dz => {
    const a = corner(0, 0, dz) * (1 - fx) + corner(1, 0, dz) * fx;
    const b = corner(0, 1, dz) * (1 - fx) + corner(1, 1, dz) * fx;
    return a * (1 - fy) + b * fy;
  };
  return layer(0) * (1 - fz) + layer(1) * fz;
}

export function rockRelief(x, y, z, seed = 0) {
  const broad = noise3(x * 1.5, y * 1.5, z * 1.5, seed) - .5;
  const medium = noise3(x * 4.5, y * 4.5, z * 4.5, seed + 11) - .5;
  const fine = noise3(x * 12, y * 12, z * 12, seed + 29) - .5;
  return Math.max(-1, Math.min(1, broad * 1.15 + medium * .7 + fine * .22));
}

export function sampleSurface(kind, x, y) {
  const broad = noise2(x / 63, y / 63, 17) - .5;
  const medium = noise2(x / 19, y / 19, 29) - .5;
  const fine = noise2(x / 3.5, y / 3.5, 41) - .5;
  const fleck = hash(Math.floor(x), Math.floor(y), 53);
  let r, g, b, bump;
  if (kind === 'stone') {
    const mineral = broad * 24 + medium * 28 + fine * 11;
    const lichen = noise2(x / 31, y / 31, 67) > .69 ? 1 : 0;
    r = 225 + mineral - lichen * 17;
    g = 228 + mineral + lichen * 2;
    b = 222 + mineral - lichen * 19;
    bump = 128 + broad * 38 + medium * 63 + fine * 56 + (fleck - .5) * 43;
  } else if (kind === 'water') {
    const wave = Math.sin(y * .16 + broad * 8) * 2.8;
    const tone = broad * 18 + medium * 15 + wave;
    r = 211 + tone;
    g = 231 + tone;
    b = 225 + tone;
    bump = 128 + medium * 20 + fine * 9 + wave * 3;
  } else if (kind === 'wood' || kind === 'roof') {
    const grain = Math.sin(y * .62 + broad * 7) * 7 + Math.sin(y * 1.9 + medium * 4) * 2;
    const tone = broad * 19 + medium * 10 + grain;
    r = 226 + tone; g = 223 + tone; b = 214 + tone;
    bump = 128 + broad * 19 + grain * 3 + fine * 24;
  } else if (kind === 'moss') {
    const tone = broad * 30 + medium * 22 + fine * 7;
    r = 222 + tone; g = 236 + tone; b = 211 + tone;
    bump = 128 + medium * 45 + fine * 50 + (fleck - .5) * 26;
  } else if (kind === 'sand' || kind === 'soil') {
    const tone = broad * 11 + medium * 8 + fine * 4;
    r = (kind === 'sand' ? 239 : 223) + tone;
    g = (kind === 'sand' ? 236 : 222) + tone;
    b = (kind === 'sand' ? 222 : 207) + tone;
    bump = 128 + medium * 16 + fine * 22 + (fleck - .5) * 14;
  } else {
    throw new RangeError(`Unknown surface: ${kind}`);
  }
  return {r: clampByte(r), g: clampByte(g), b: clampByte(b), bump: clampByte(bump)};
}
