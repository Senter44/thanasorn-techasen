import {mkdir,writeFile,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import path from 'node:path';
const stage = path.resolve('.sites-runtime/three-0.186.0');
await mkdir(stage,{recursive:true});
const response = await fetch('https://registry.npmjs.org/three/-/three-0.186.0.tgz');
if(!response.ok) throw new Error(`Three.js download failed: ${response.status}`);
const bytes = Buffer.from(await response.arrayBuffer());
const hash = createHash('sha512').update(bytes).digest('base64');
if(hash !== 'cr/fIM2ddMSVbYVgkfD4jLJv7Fh/8ZTjvo+7gQeSVGUZHxpx9FDwoL5iC7hUz/LiRA8wMbqfnb90xKfm1/HHkQ==') throw new Error('Dependency integrity mismatch');
const archive = path.join(stage,'three.tgz');
await writeFile(archive,bytes);
execFileSync('tar',['-xzf',archive,'-C',stage]);
const files = {
  'build/three.module.js':'three.module.js',
  'build/three.core.js':'three.core.js',
  'examples/jsm/controls/OrbitControls.js':'addons/controls/OrbitControls.js',
  'examples/jsm/loaders/GLTFLoader.js':'addons/loaders/GLTFLoader.js',
  'examples/jsm/utils/BufferGeometryUtils.js':'addons/utils/BufferGeometryUtils.js',
  'examples/jsm/utils/SkeletonUtils.js':'addons/utils/SkeletonUtils.js',
  'LICENSE':'THREE-LICENSE.txt',
};
for(const [from,to] of Object.entries(files)) {
  const target=path.resolve('dist/vendor',to);
  await mkdir(path.dirname(target),{recursive:true});
  await copyFile(path.join(stage,'package',from),target);
}
console.log('Vendored verified Three.js 0.186.0 with selected addons and MIT license.');
