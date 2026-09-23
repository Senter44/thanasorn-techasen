import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,statSync} from 'node:fs';
const html = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
test('every garden destination has matching readable content', () => {
  for (const place of ['projects','experience','about','toolkit','contact']) {
    assert.match(html, new RegExp(`data-open="${place}"`));
    assert.match(html, new RegExp(`data-panel="${place}"`));
  }
});
test('all directly referenced local page assets are present', () => {
  for (const [,value] of html.matchAll(/(?:src|href)="(\.\/[^"?#]*)/g)) {
    assert.ok(existsSync(new URL('../dist/' + value, import.meta.url)), value);
  }
});
test('CV and contact stay available without map discovery', () => {
  assert.match(html, /id="destinations"/);
  assert.match(html, /<noscript>/);
  assert.match(html, /mailto:hydrolysis4re@gmail.com/);
  assert.match(html, /href="https:\/\/github.com\/Senter44"/);
  assert.ok(existsSync(new URL('../dist/assets/thanasorn-techasen-cv.pdf', import.meta.url)));
});
test('the complete Three.js import graph is vendored locally',()=>{
  const root=new URL('../dist/',import.meta.url);
  const seen=new Set();
  function visit(url){
    if(seen.has(url.href))return;
    seen.add(url.href);
    assert.ok(existsSync(url),url.href);
    const source=readFileSync(url,'utf8');
    for(const [,specifier] of source.matchAll(/^[ \t]*(?:import|export)\s+(?:[^;]*?\sfrom\s*)?['"]([^'"]+)['"]/gm)){
      const target=specifier==='three'?new URL('vendor/three.module.js',root):specifier.startsWith('three/addons/')?new URL('vendor/addons/'+specifier.slice(13),root):new URL(specifier,url);
      target.search='';
      visit(target);
    }
  }
  visit(new URL('scene.js',root));
  assert.ok(seen.size>=7);
  for(const asset of ['assets/garden.glb','bamboo-3d/bamboo.glb'])assert.ok(existsSync(new URL(asset,root)),asset);
});

test('changed scene detail modules use revisioned URLs for returning visitors', () => {
  const scene = readFileSync(new URL('../dist/scene.js', import.meta.url), 'utf8');
  assert.match(scene, /scene-details\.js\?v=4/);
  assert.match(scene, /focus-details\.js\?v=4/);
});

test('high-detail preview keeps its photographic stone maps local and web-sized', () => {
  for (const name of ['rock_01_diff_1k.jpg', 'rock_01_nor_gl_1k.jpg', 'mossy_rock_diff_1k.jpg', 'mossy_rock_nor_gl_1k.jpg']) {
    const path = new URL(`../dist/assets/materials/${name}`, import.meta.url);
    assert.ok(existsSync(path), name);
    assert.ok(statSync(path).size < 2_000_000, name);
    const bytes = readFileSync(path);
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
  }
});
